import logging
import re
from typing import Any

from django.conf import settings
from django.db import transaction

from testy.core.models import Project
from testy.tests_description.models import TestCase, TestCaseStep, TestSuite
from testy.tests_description.services.zephyr_parser import ZephyrScaleParser, ZephyrTestCase
from testy.users.models import User

logger = logging.getLogger('testy')

PRIORITY_MAP = {
    'low': 1,
    'normal': 2,
    'high': 3,
    'critical': 4,
}


class ZephyrImportResult:
    def __init__(self):
        self.suites_created = 0
        self.cases_created = 0
        self.steps_created = 0
        self.errors: list[dict[str, Any]] = []

    def to_dict(self):
        return {
            'suites_created': self.suites_created,
            'cases_created': self.cases_created,
            'steps_created': self.steps_created,
            'errors': self.errors,
        }


class ZephyrImportService:
    """Imports test cases from a Zephyr Scale XLSX export into a TestY project."""

    def __init__(self, project: Project, user: User, root_suite: TestSuite | None = None):
        self._project = project
        self._user = user
        self._root_suite = root_suite
        self._suite_cache: dict[str, TestSuite] = {}
        self._result = ZephyrImportResult()

    def execute(self, file_content: bytes, progress_callback=None) -> ZephyrImportResult:
        parser = ZephyrScaleParser(file_content)
        test_cases = parser.parse()

        if not test_cases:
            logger.warning('Zephyr import: no test cases found in file')
            return self._result

        self._build_suite_tree(parser.get_folder_tree())

        total = len(test_cases)
        for idx, zephyr_tc in enumerate(test_cases, start=1):
            try:
                self._import_test_case(zephyr_tc)
            except Exception as exc:
                logger.error('Zephyr import error on %s: %s', zephyr_tc.key, exc)
                self._result.errors.append({
                    'key': zephyr_tc.key,
                    'name': zephyr_tc.name,
                    'error': str(exc),
                })

            if progress_callback and idx % 10 == 0:
                progress_callback(idx, total)

        if progress_callback:
            progress_callback(total, total)

        logger.info(
            'Zephyr import complete: %d suites, %d cases, %d steps, %d errors',
            self._result.suites_created,
            self._result.cases_created,
            self._result.steps_created,
            len(self._result.errors),
        )
        return self._result

    def _build_suite_tree(self, folders: set[str]):
        sorted_folders = sorted(folders, key=lambda f: f.count('/'))

        for folder_path in sorted_folders:
            if folder_path in self._suite_cache:
                continue
            self._get_or_create_suite(folder_path)

    def _get_or_create_suite(self, folder_path: str) -> TestSuite:
        if folder_path in self._suite_cache:
            return self._suite_cache[folder_path]

        parts = [p for p in folder_path.split('/') if p]
        if not parts:
            if self._root_suite:
                return self._root_suite
            return self._get_or_create_suite('/Import')

        parent_path = '/' + '/'.join(parts[:-1]) if len(parts) > 1 else None
        parent = None
        if parent_path:
            parent = self._get_or_create_suite(parent_path)
        elif self._root_suite:
            parent = self._root_suite

        suite_name = parts[-1][:settings.CHAR_FIELD_MAX_LEN]

        existing = TestSuite.objects.filter(
            project=self._project,
            name=suite_name,
            parent=parent,
            is_deleted=False,
        ).first()

        if existing:
            self._suite_cache[folder_path] = existing
            return existing

        suite = TestSuite.model_create(
            fields=['parent', 'project', 'name', 'description'],
            data={
                'parent': parent,
                'project': self._project,
                'name': suite_name,
                'description': '',
            },
        )
        self._suite_cache[folder_path] = suite
        self._result.suites_created += 1
        return suite

    @transaction.atomic
    def _import_test_case(self, ztc: ZephyrTestCase):
        suite = self._resolve_suite(ztc.folder)

        scenario = self._build_scenario(ztc)
        has_steps = bool(ztc.steps)

        estimate_seconds = self._parse_estimate(ztc.estimated_time)
        tc_name = ztc.name[:settings.CHAR_FIELD_MAX_LEN] if ztc.name else ztc.key

        case = TestCase.model_create(
            fields=['name', 'project', 'suite', 'setup', 'scenario', 'expected', 'teardown',
                    'estimate', 'description', 'is_steps'],
            data={
                'name': tc_name,
                'project': self._project,
                'suite': suite,
                'setup': ztc.precondition or '',
                'scenario': scenario if not has_steps else '',
                'expected': '',
                'teardown': '',
                'estimate': estimate_seconds,
                'description': self._build_description(ztc),
                'is_steps': has_steps,
            },
        )
        self._result.cases_created += 1

        if has_steps:
            history_id = case.history.first().history_id
            for sort_order, step in enumerate(ztc.steps):
                TestCaseStep.model_create(
                    fields=['name', 'project', 'scenario', 'expected', 'test_case',
                            'test_case_history_id', 'sort_order'],
                    data={
                        'name': (step.step[:settings.CHAR_FIELD_MAX_LEN]
                                 if step.step else f'Step {sort_order + 1}'),
                        'project': self._project,
                        'scenario': step.step or '',
                        'expected': step.expected_result or '',
                        'test_case': case,
                        'test_case_history_id': history_id,
                        'sort_order': sort_order,
                    },
                )
                self._result.steps_created += 1

        return case

    def _resolve_suite(self, folder_path: str) -> TestSuite:
        if not folder_path:
            folder_path = '/Import'
        return self._get_or_create_suite(folder_path)

    @staticmethod
    def _build_scenario(ztc: ZephyrTestCase) -> str:
        if ztc.plain_text:
            return ztc.plain_text
        if ztc.bdd:
            return ztc.bdd
        if ztc.objective:
            return ztc.objective
        return ''

    @staticmethod
    def _build_description(ztc: ZephyrTestCase) -> str:
        parts = []
        if ztc.key:
            parts.append(f'Zephyr Key: {ztc.key}')
        if ztc.status:
            parts.append(f'Zephyr Status: {ztc.status}')
        if ztc.priority:
            parts.append(f'Priority: {ztc.priority}')
        if ztc.component:
            parts.append(f'Component: {ztc.component}')
        if ztc.labels:
            parts.append(f'Labels: {ztc.labels}')
        if ztc.owner:
            parts.append(f'Owner: {ztc.owner}')
        if ztc.objective:
            parts.append(f'Objective: {ztc.objective}')
        return '\n'.join(parts)

    @staticmethod
    def _parse_estimate(value: str) -> int:
        if not value:
            return 0
        match = re.match(r'^(\d+)', value.strip())
        if match:
            return int(match.group(1))
        return 0
