import pytest
from io import BytesIO
from openpyxl import Workbook
from rest_framework.test import APIClient

from tests.factories import ProjectFactory, TestSuiteFactory, UserFactory
from testy.tests_description.models import TestCase, TestCaseStep, TestSuite


def _make_xlsx(rows):
    """Create an in-memory XLSX file from a list of row tuples."""
    wb = Workbook()
    ws = wb.active
    ws.title = 'Sheet0'
    headers = [
        'Key', 'Name', 'Status', 'Precondition', 'Objective', 'Folder',
        'Priority', 'Component', 'Labels', 'Owner', 'Estimated Time',
        'Coverage (Issues)', 'Coverage (Pages)',
        'Test Script (Step-by-Step) - Step',
        'Test Script (Step-by-Step) - Test Data',
        'Test Script (Step-by-Step) - Expected Result',
        'Test Script (Plain Text)', 'Test Script (BDD)',
    ]
    ws.append(headers)
    for row in rows:
        padded = list(row) + [None] * (18 - len(row))
        ws.append(padded)
    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf


@pytest.mark.django_db
class TestZephyrImportAPI:

    def setup_method(self):
        self.user = UserFactory(is_superuser=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.project = ProjectFactory()

    def _import(self, rows, project_id=None, root_suite_id=None):
        xlsx = _make_xlsx(rows)
        data = {'file': ('test.xlsx', xlsx, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        payload = {'project_id': project_id or self.project.pk}
        if root_suite_id:
            payload['root_suite_id'] = root_suite_id
        payload['file'] = xlsx
        return self.client.post(
            '/api/v2/import/zephyr/',
            payload,
            format='multipart',
        )

    def test_import_creates_suites_and_cases(self):
        rows = [
            ('TC-1', 'Login test', 'Draft', '', '', '/Auth/Login', 'Normal',
             None, '', '', '', '', '', 'Open login page', '', 'Page opens', None, None),
            (None, None, None, None, None, None, None,
             None, None, None, None, None, None,
             'Enter credentials', '', 'User logged in', None, None),
            ('TC-2', 'Register test', 'Draft', '', '', '/Auth/Register', 'High',
             None, '', '', '', '', '', 'Open register page', '', 'Page opens', None, None),
        ]
        response = self._import(rows)
        assert response.status_code == 201
        data = response.json()
        assert data['cases_created'] == 2
        assert data['suites_created'] >= 2
        assert data['steps_created'] == 3

    def test_import_creates_nested_suites(self):
        rows = [
            ('TC-1', 'Deep test', 'Draft', '', '', '/A/B/C', 'Normal',
             None, '', '', '', '', '', None, None, None, None, None),
        ]
        response = self._import(rows)
        assert response.status_code == 201
        assert TestSuite.objects.filter(project=self.project, name='A', is_deleted=False).exists()
        assert TestSuite.objects.filter(project=self.project, name='B', is_deleted=False).exists()
        assert TestSuite.objects.filter(project=self.project, name='C', is_deleted=False).exists()

    def test_import_with_root_suite(self):
        root = TestSuiteFactory(project=self.project, name='Root')
        rows = [
            ('TC-1', 'Nested test', 'Draft', '', '', '/SubFolder', 'Normal',
             None, '', '', '', '', '', 'Step 1', '', 'Expected', None, None),
        ]
        response = self._import(rows, root_suite_id=root.pk)
        assert response.status_code == 201
        sub = TestSuite.objects.filter(project=self.project, name='SubFolder', is_deleted=False).first()
        assert sub is not None
        assert sub.parent_id == root.pk

    def test_import_preserves_precondition_as_setup(self):
        rows = [
            ('TC-1', 'With precondition', 'Draft', 'Must be logged in', '', '/Folder', 'Normal',
             None, '', '', '', '', '', None, None, None, None, None),
        ]
        response = self._import(rows)
        assert response.status_code == 201
        tc = TestCase.objects.filter(project=self.project, name='With precondition').first()
        assert tc is not None
        assert tc.setup == 'Must be logged in'

    def test_import_steps_with_sort_order(self):
        rows = [
            ('TC-1', 'Ordered steps', 'Draft', '', '', '/Folder', 'Normal',
             None, '', '', '', '', '', 'First', '', '', None, None),
            (None, None, None, None, None, None, None,
             None, None, None, None, None, None,
             'Second', '', '', None, None),
            (None, None, None, None, None, None, None,
             None, None, None, None, None, None,
             'Third', '', '', None, None),
        ]
        response = self._import(rows)
        assert response.status_code == 201
        tc = TestCase.objects.filter(project=self.project, name='Ordered steps').first()
        steps = list(tc.steps.order_by('sort_order'))
        assert len(steps) == 3
        assert steps[0].scenario == 'First'
        assert steps[1].scenario == 'Second'
        assert steps[2].scenario == 'Third'

    def test_import_empty_file_returns_201(self):
        response = self._import([])
        assert response.status_code == 201
        data = response.json()
        assert data['cases_created'] == 0

    def test_import_requires_auth(self):
        client = APIClient()
        xlsx = _make_xlsx([('TC-1', 'Test', 'Draft', '', '', '/F', 'Normal',
                            None, '', '', '', '', '', None, None, None, None, None)])
        response = client.post(
            '/api/v2/import/zephyr/',
            {'file': xlsx, 'project_id': self.project.pk},
            format='multipart',
        )
        assert response.status_code in (401, 403)

    def test_import_invalid_project_returns_400(self):
        rows = [
            ('TC-1', 'Test', 'Draft', '', '', '/F', 'Normal',
             None, '', '', '', '', '', None, None, None, None, None),
        ]
        response = self._import(rows, project_id=99999)
        assert response.status_code == 400

    def test_import_wrong_file_format_returns_400(self):
        response = self.client.post(
            '/api/v2/import/zephyr/',
            {'file': BytesIO(b'not an xlsx'), 'project_id': self.project.pk},
            format='multipart',
        )
        assert response.status_code == 400


@pytest.mark.django_db
class TestZephyrImportService:

    def test_import_service_idempotent_suites(self):
        from testy.tests_description.services.importer import ZephyrImportService

        project = ProjectFactory()
        user = UserFactory()

        rows = [
            ('TC-1', 'Test A', 'Draft', '', '', '/Folder', 'Normal',
             None, '', '', '', '', '', None, None, None, None, None),
        ]
        xlsx = _make_xlsx(rows).read()

        svc1 = ZephyrImportService(project=project, user=user)
        r1 = svc1.execute(xlsx)

        svc2 = ZephyrImportService(project=project, user=user)
        r2 = svc2.execute(xlsx)

        assert r1.suites_created == 1
        assert r2.suites_created == 0
        assert TestSuite.objects.filter(project=project, name='Folder', is_deleted=False).count() == 1
