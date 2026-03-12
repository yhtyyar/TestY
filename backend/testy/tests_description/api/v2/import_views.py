import logging

from rest_framework import serializers, status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from testy.core.models import Project
from testy.tests_description.models import TestSuite
from testy.tests_description.services.importer import ZephyrImportService
from testy.tests_description.tasks import import_zephyr_scale

logger = logging.getLogger('testy')

ALLOWED_EXTENSIONS = ('.xlsx', '.xls')
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


class ZephyrImportSerializer(serializers.Serializer):
    file = serializers.FileField(required=True)
    project_id = serializers.IntegerField(required=True)
    root_suite_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    async_import = serializers.BooleanField(required=False, default=False)

    def validate_file(self, value):
        if not value.name.lower().endswith(ALLOWED_EXTENSIONS):
            raise serializers.ValidationError(
                f'Unsupported file format. Allowed: {", ".join(ALLOWED_EXTENSIONS)}',
            )
        if value.size > MAX_FILE_SIZE:
            raise serializers.ValidationError(
                f'File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)} MB',
            )
        return value

    def validate_project_id(self, value):
        if not Project.objects.filter(pk=value, is_deleted=False).exists():
            raise serializers.ValidationError('Project not found.')
        return value

    def validate_root_suite_id(self, value):
        if value is not None and not TestSuite.objects.filter(pk=value, is_deleted=False).exists():
            raise serializers.ValidationError('Suite not found.')
        return value


class ZephyrImportView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ZephyrImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data['file']
        project_id = serializer.validated_data['project_id']
        root_suite_id = serializer.validated_data['root_suite_id']
        use_async = serializer.validated_data['async_import']

        file_content = uploaded_file.read()

        if use_async:
            task = import_zephyr_scale.delay(
                file_content=file_content,
                project_id=project_id,
                user_id=request.user.pk,
                root_suite_id=root_suite_id,
            )
            return Response(
                {'task_id': task.id, 'status': 'started'},
                status=status.HTTP_202_ACCEPTED,
            )

        project = Project.objects.get(pk=project_id)
        root_suite = TestSuite.objects.get(pk=root_suite_id) if root_suite_id else None

        service = ZephyrImportService(
            project=project,
            user=request.user,
            root_suite=root_suite,
        )
        result = service.execute(file_content)

        return Response(result.to_dict(), status=status.HTTP_201_CREATED)
