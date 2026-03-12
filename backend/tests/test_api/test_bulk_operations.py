import pytest
from rest_framework.test import APIClient

from tests.factories import (
    ProjectFactory,
    ResultStatusFactory,
    TestCaseFactory,
    TestFactory,
    TestPlanFactory,
    TestSuiteFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestBulkTestUpdate:

    def setup_method(self):
        self.user = UserFactory(is_superuser=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.project = ProjectFactory()

    def test_bulk_update_assignee(self):
        plan = TestPlanFactory(project=self.project)
        suite = TestSuiteFactory(project=self.project)
        cases = [TestCaseFactory(project=self.project, suite=suite) for _ in range(3)]
        tests = [TestFactory(project=self.project, plan=plan, case=c) for c in cases]
        assignee = UserFactory()

        response = self.client.patch(
            '/api/v2/tests/bulk-update/',
            {'ids': [t.pk for t in tests], 'assignee_id': assignee.pk},
            format='json',
        )
        assert response.status_code == 200
        assert response.json()['updated'] == 3

    def test_bulk_update_no_fields_returns_400(self):
        response = self.client.patch(
            '/api/v2/tests/bulk-update/',
            {'ids': [1]},
            format='json',
        )
        assert response.status_code == 400

    def test_bulk_update_empty_ids_returns_400(self):
        response = self.client.patch(
            '/api/v2/tests/bulk-update/',
            {'ids': [], 'assignee_id': 1},
            format='json',
        )
        assert response.status_code == 400

    def test_bulk_update_requires_auth(self):
        client = APIClient()
        response = client.patch(
            '/api/v2/tests/bulk-update/',
            {'ids': [1], 'assignee_id': 1},
            format='json',
        )
        assert response.status_code in (401, 403)


@pytest.mark.django_db
class TestBulkTestCaseMove:

    def setup_method(self):
        self.user = UserFactory(is_superuser=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.project = ProjectFactory()

    def test_bulk_move_test_cases(self):
        suite_src = TestSuiteFactory(project=self.project)
        suite_dst = TestSuiteFactory(project=self.project)
        cases = [TestCaseFactory(project=self.project, suite=suite_src) for _ in range(3)]

        response = self.client.post(
            '/api/v2/test-cases/bulk-move/',
            {'ids': [c.pk for c in cases], 'target_suite_id': suite_dst.pk},
            format='json',
        )
        assert response.status_code == 200
        assert response.json()['moved'] == 3

    def test_bulk_move_requires_target_suite_id(self):
        response = self.client.post(
            '/api/v2/test-cases/bulk-move/',
            {'ids': [1]},
            format='json',
        )
        assert response.status_code == 400


@pytest.mark.django_db
class TestBulkResultCreate:

    def setup_method(self):
        self.user = UserFactory(is_superuser=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.project = ProjectFactory()

    def test_bulk_create_results(self):
        plan = TestPlanFactory(project=self.project)
        suite = TestSuiteFactory(project=self.project)
        cases = [TestCaseFactory(project=self.project, suite=suite) for _ in range(3)]
        tests = [TestFactory(project=self.project, plan=plan, case=c) for c in cases]
        status = ResultStatusFactory(project=self.project)

        results_data = [{'test_id': t.pk, 'status_id': status.pk, 'comment': 'ok'} for t in tests]
        response = self.client.post(
            '/api/v2/test-results/bulk-create/',
            {'results': results_data},
            format='json',
        )
        assert response.status_code == 201
        assert response.json()['created'] == 3

    def test_bulk_create_empty_results_returns_400(self):
        response = self.client.post(
            '/api/v2/test-results/bulk-create/',
            {'results': []},
            format='json',
        )
        assert response.status_code == 400
