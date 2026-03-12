import logging

from django.db import transaction
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from testy.tests_description.models import TestCase
from testy.tests_representation.models import Test, TestResult

logger = logging.getLogger('testy')

BULK_MAX_ITEMS = 500


class BulkIdsSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.IntegerField(), max_length=BULK_MAX_ITEMS, allow_empty=False)


class BulkTestUpdateSerializer(BulkIdsSerializer):
    assignee_id = serializers.IntegerField(required=False, allow_null=True)


class BulkTestCaseMoveSerializer(BulkIdsSerializer):
    target_suite_id = serializers.IntegerField()


class BulkResultCreateItemSerializer(serializers.Serializer):
    test_id = serializers.IntegerField()
    status_id = serializers.IntegerField()
    comment = serializers.CharField(required=False, default='', allow_blank=True)


class BulkResultCreateSerializer(serializers.Serializer):
    results = serializers.ListField(
        child=BulkResultCreateItemSerializer(),
        max_length=BULK_MAX_ITEMS,
        allow_empty=False,
    )


class BulkTestUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request):
        serializer = BulkTestUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ids = serializer.validated_data['ids']
        update_fields = {}

        if 'assignee_id' in serializer.validated_data:
            update_fields['assignee_id'] = serializer.validated_data['assignee_id']

        if not update_fields:
            return Response({'detail': 'No fields to update.'}, status=status.HTTP_400_BAD_REQUEST)

        updated = Test.objects.filter(id__in=ids, is_deleted=False).update(**update_fields)
        logger.info('Bulk update tests: %d updated by user %s', updated, request.user.pk)
        return Response({'updated': updated})


class BulkTestCaseMoveView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = BulkTestCaseMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ids = serializer.validated_data['ids']
        target_suite_id = serializer.validated_data['target_suite_id']

        updated = TestCase.objects.filter(id__in=ids, is_deleted=False).update(suite_id=target_suite_id)
        logger.info('Bulk move test cases: %d moved to suite %d by user %s', updated, target_suite_id, request.user.pk)
        return Response({'moved': updated})


class BulkResultCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = BulkResultCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        results_data = serializer.validated_data['results']
        created = []
        for item in results_data:
            test = Test.objects.get(id=item['test_id'], is_deleted=False)
            result = TestResult.objects.create(
                project=test.project,
                test=test,
                status_id=item['status_id'],
                user=request.user,
                comment=item.get('comment', ''),
            )
            created.append(result.pk)

        logger.info('Bulk create results: %d created by user %s', len(created), request.user.pk)
        return Response({'created': len(created), 'ids': created}, status=status.HTTP_201_CREATED)
