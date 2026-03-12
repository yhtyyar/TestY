import logging

from celery import shared_task
from celery_progress.backend import ProgressRecorder

from testy.core.models import Project
from testy.tests_description.services.importer import ZephyrImportService
from testy.tests_description.models import TestSuite
from testy.users.models import User

logger = logging.getLogger('testy')


@shared_task(bind=True, name='testy.tests_description.tasks.import_zephyr_scale')
def import_zephyr_scale(self, file_content: bytes, project_id: int, user_id: int, root_suite_id: int | None = None):
    progress = ProgressRecorder(self)
    progress.set_progress(0, 100, description='Starting import...')

    project = Project.objects.get(pk=project_id)
    user = User.objects.get(pk=user_id)
    root_suite = TestSuite.objects.get(pk=root_suite_id) if root_suite_id else None

    def progress_callback(current, total):
        pct = int((current / total) * 100) if total else 100
        progress.set_progress(current, total, description=f'Importing test cases: {current}/{total}')

    service = ZephyrImportService(project=project, user=user, root_suite=root_suite)
    result = service.execute(file_content, progress_callback=progress_callback)

    progress.set_progress(100, 100, description='Import completed')
    logger.info(
        'Zephyr import task finished for project %d: %s',
        project_id,
        result.to_dict(),
    )
    return result.to_dict()
