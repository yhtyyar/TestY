# TestY TMS - Test Management System
# Copyright (C) 2025 KNS Group LLC (YADRO)
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
# Also add information on how to contact you by electronic and paper mail.
#
# If your software can interact with users remotely through a computer
# network, you should also make sure that it provides a way for users to
# get its source.  For example, if your program is a web application, its
# interface could display a "Source" link that leads users to an archive
# of the code.  There are many ways you could offer source, and different
# solutions will be better for different programs; see section 13 for the
# specific requirements.
#
# You should also get your employer (if you work as a programmer) or school,
# if any, to sign a "copyright disclaimer" for the program, if necessary.
# For more information on this, and how to apply and follow the GNU AGPL, see
# <http://www.gnu.org/licenses/>.
from copy import deepcopy
from dataclasses import dataclass
from itertools import zip_longest
from typing import Any, TypedDict
from uuid import uuid4

from django.apps import apps
from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from django.core.exceptions import FieldDoesNotExist
from django.db import connection, transaction
from django.db.models import CASCADE, ManyToManyRel, ManyToOneRel, Model
from django.db.models.sql import Query
from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.generics import QuerySet
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from testy.core.services.recovery import RecoveryService
from testy.paginations import StandardSetPagination
from testy.root.api.v2.serializers import RecoveryInputSerializer
from testy.root.ltree.models import LtreeModel
from testy.root.models import DeletedQuerySet, SoftDeleteQuerySet
from testy.root.tasks import create_archive_histories
from testy.swagger.core import preview_schema
from testy.tests_description.models import TestSuite
from testy.tests_description.services.suites import TestSuiteService
from testy.utilities.request import mock_request_with_query_params

UniqueRelationSet = set[ManyToOneRel | GenericRelation | ManyToManyRel]
_TARGET_OBJECT = 'target_object'
_POST = 'post'
_ID = 'id'


class TargetObject(TypedDict):
    app_label: str
    model: str
    pk: Any


class QuerySetMeta(TypedDict):
    app_label: str
    model: str
    query: Query


class QuerySetInfo(TypedDict):
    verbose_name: str
    verbose_name_related_model: str
    count: int


class MetaForCaching(TypedDict):
    target_object: TargetObject
    querysets_meta: list[QuerySetMeta]


CacheReadyQuerySet = tuple[list[QuerySetMeta], list[QuerySetInfo]]


@dataclass
class RelatedQuerysetConfig:
    """
    Dataclass for related querysets configuration.

    manager_name: name of the related queryset manager
    ignore_on_delete_property: ignore on_delete property in gathering related querysets.
    distinct_fields: mapping  Model to distinct field for restore
    qs_info_list_required: is info required
    """

    ignore_on_delete_property: bool = True
    manager_name: str = 'objects'
    qs_info_list_required: bool = False
    distinct_fields: dict[str, str] | None = None


class RelationTreeMixin:
    def build_relation_tree(self, model, tree: list | None = None) -> UniqueRelationSet:  # noqa: WPS231
        """
        Build tree of relations by model to prevent duplicate recursive queries gathering.

        Args:
            model: model class.
            tree: list of gathered relations.

        Returns:
            set of different gathered relations.
        """
        if not tree:
            tree = []
        related_objects = list(model._meta.related_objects)
        related_objects.extend(model._meta.private_fields)
        for single_object in related_objects:
            if not isinstance(single_object, GenericRelation):
                # on_delete option is kept in identity with index 6
                if not single_object.identity[6] == CASCADE:  # noqa: WPS508
                    continue
            if single_object.model == single_object.related_model:
                continue
            self._check_for_relation(single_object, tree)
            if single_object.related_model._meta.related_objects:
                self.build_relation_tree(single_object.related_model, tree)
        return set(tree)

    def get_all_related_querysets(  # noqa: WPS231, WPS211
        self,
        qs,
        model,
        qs_info_list: list[QuerySetInfo] | None = None,
        qs_meta_list: list[QuerySetMeta] | None = None,
        relation_tree=None,
    ) -> CacheReadyQuerySet:
        """
        Recursive function to get all related objects of instance as list of querysets.

        Args:
            qs: queryset or instance to find related objects for.
            model: model in which we are looking for relations.
            qs_info_list: list of descriptions of elements to be deleted.
            qs_meta_list: meta information to restore querysets from cache.
            relation_tree: List of relations to avoid duplicate querysets.

        Returns:
            List of querysets.
        """
        config = self._get_config()
        manager = config.manager_name
        distinct_fields = config.distinct_fields
        if distinct_fields is None:
            distinct_fields = {}
        if qs_info_list is None:
            qs_info_list = []
        if qs_meta_list is None:
            qs_meta_list = []
        related_objects = list(model._meta.related_objects)
        related_objects.extend(model._meta.private_fields)
        for single_object in related_objects:
            if not isinstance(single_object, GenericRelation):
                if not single_object.identity[6] == CASCADE and not config.ignore_on_delete_property:  # noqa: WPS508
                    continue
            if single_object.model == single_object.related_model:
                continue
            if single_object not in relation_tree:
                continue
            sub_qs = self._replace_is_deleted_condition(qs)
            if isinstance(single_object, GenericRelation):
                filter_option = {
                    f'{single_object.object_id_field_name}__in': sub_qs.values(_ID),
                    f'{single_object.content_type_field_name}': ContentType.objects.get_for_model(model),
                }
            else:
                filter_option = {f'{single_object.field.attname}__in': sub_qs.values(_ID)}  # noqa: WPS237
            if isinstance(single_object.related_model, LtreeModel):
                new_qs = getattr(single_object.related_model, manager).filter(**filter_option).get_descendants(
                    include_self=True,
                )
            else:
                new_qs = getattr(single_object.related_model, manager).filter(**filter_option)
            model_name = new_qs.model.__name__
            if distinct_field := distinct_fields.get(model_name):
                distinct_items = new_qs.values(_ID, distinct_field).order_by(distinct_field).distinct(distinct_field)
                new_qs = new_qs.filter(id__in=[item[_ID] for item in distinct_items])
            model_meta_data = single_object.related_model._meta
            if config.qs_info_list_required:
                qs_info_list.append(
                    QuerySetInfo(
                        verbose_name=model_meta_data.verbose_name,
                        verbose_name_related_model=single_object.model._meta.verbose_name_plural,
                        count=new_qs.count(),
                    ),
                )
            qs_meta_list.append(
                QuerySetMeta(
                    app_label=model_meta_data.app_label,
                    model=model_meta_data.model_name,
                    query=new_qs.query,
                ),
            )
            if single_object.related_model._meta.related_objects:
                self.get_all_related_querysets(
                    qs=new_qs,
                    model=single_object.related_model,
                    qs_info_list=qs_info_list,
                    qs_meta_list=qs_meta_list,
                    relation_tree=relation_tree,
                )
        return qs_meta_list, qs_info_list

    def _get_config(self):
        match self.action:
            case str() as action if action in {'archive_objects', 'restore_archived'}:
                return RelatedQuerysetConfig()
            case 'archive_preview':
                return RelatedQuerysetConfig(qs_info_list_required=True)
            case 'restore':
                return RelatedQuerysetConfig(
                    manager_name='deleted_objects',
                    ignore_on_delete_property=False,
                    distinct_fields={'LabeledItem': 'label_id'},
                )
            case 'destroy':
                return RelatedQuerysetConfig(ignore_on_delete_property=False)
            case 'delete_preview':
                return RelatedQuerysetConfig(qs_info_list_required=True, ignore_on_delete_property=False)

    @classmethod
    def _check_for_relation(cls, new_relation: GenericRelation | ManyToManyRel | ManyToOneRel, relations):
        """
        Decide if new gathered relation clashes with previously found relations.

        Args:
            new_relation: newly found relation
            relations: already gathered relations
        """
        if isinstance(new_relation, GenericRelation):
            relations.append(new_relation)
            return
        for idx, relation in enumerate(relations):
            if new_relation.related_model != relation.related_model:
                continue
            if new_relation.model == relation.model:
                return
            if new_relation.model.ModelHierarchyWeightMeta.weight > relation.model.ModelHierarchyWeightMeta.weight:
                relations[idx] = new_relation
        relations.append(new_relation)

    @classmethod
    def _get_instance_from_metadata(cls, meta_data: TargetObject) -> Model:
        model = apps.get_model(app_label=meta_data.get('app_label'), model_name=meta_data.get('model'))
        return model.objects.get(pk=meta_data.get('pk'))

    @classmethod
    def _get_qs_from_meta_data(cls, meta_data: QuerySetMeta, qs_class: type[QuerySet]) -> QuerySet[Model]:
        model = apps.get_model(app_label=meta_data.get('app_label'), model_name=meta_data.get('model'))
        return qs_class(model=model, query=meta_data.get('query'))

    @classmethod
    def _replace_is_deleted_condition(cls, qs: QuerySet[Model]):
        new_qs = deepcopy(qs)
        new_qs.query.where.children = [
            child for child in qs.query.where.children if 'is_deleted' not in str(child)
        ]
        return new_qs


class TestyDestroyModelMixin(RelationTreeMixin):

    def destroy(self, request, pk, *args, **kwargs):  # noqa: WPS231
        """
        Replace default destroy method.

        Replacement for default destroy action, if user retrieved deleted objects, we save gathered querysets to
        cache and if he submits deletion within time gap use user cookie to retrieve cache and delete objects.

        Args:
            request: Django request object
            pk: primary key
            args: positional arguments
            kwargs: keyword arguments

        Returns:
            Response with no content status code
        """
        querysets_to_delete: list[QuerySet] = []
        target_object = self.get_object()
        cache_key = request.COOKIES.get('delete_cache')
        if cache_key and cache.get(cache_key):
            meta_to_delete: MetaForCaching = cache.get(cache_key)
            if self._get_instance_from_metadata(meta_to_delete.get(_TARGET_OBJECT)) == target_object:
                for elem in meta_to_delete['querysets_meta']:
                    querysets_to_delete.append(
                        self._get_qs_from_meta_data(elem, qs_class=SoftDeleteQuerySet),
                    )
            cache.delete(cache_key)
        if not querysets_to_delete:
            meta_querysets, _ = self.get_deleted_objects()
            for meta_data in meta_querysets:
                querysets_to_delete.append(self._get_qs_from_meta_data(meta_data, SoftDeleteQuerySet))
        with transaction.atomic():
            for related_qs in querysets_to_delete:
                if related_qs.model == TestSuite:
                    TestSuiteService.unlink_custom_attributes(related_qs)
                related_qs.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @preview_schema
    @action(
        methods=['get'],
        url_path='delete/preview',
        url_name='delete-preview',
        detail=True,
    )
    def delete_preview(self, request, pk):
        """
        Get preview of objects to delete, retrieved querysets are cached.

        Args:
            request: django request
            pk: primary key

        Returns:
            Tuple of querysets to be deleted and response info
        """
        qs_meta_list, qs_info_list = self.get_deleted_objects()
        target_object = self.get_object()
        meta_for_deletion = MetaForCaching(
            target_object=TargetObject(
                model=target_object._meta.model_name,
                app_label=target_object._meta.app_label,
                pk=target_object.pk,
            ),
            querysets_meta=qs_meta_list,
        )
        cache_key = uuid4().hex
        cache.set(cache_key, meta_for_deletion)
        response = Response(data=qs_info_list)
        response.set_cookie('delete_cache', cache_key, max_age=settings.CACHE_TTL)
        return response

    @action(
        detail=False,
        methods=[_POST],
        url_path='deleted/remove',
        url_name='deleted-remove',
    )
    def delete_permanently(self, request):
        serializer = RecoveryInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        RecoveryService.delete_permanently(self.get_queryset(), serializer.validated_data)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_deleted_objects(self) -> CacheReadyQuerySet:
        instance = self.get_object()
        qs = RecoveryService.get_objects_by_instance(instance)
        relation_tree = self.build_relation_tree(qs.model)
        qs_meta_list, qs_info_list = self.get_all_related_querysets(
            qs,
            qs.model,
            relation_tree=relation_tree,
        )
        model_meta_data = qs.model()._meta
        qs_meta_list.append(
            QuerySetMeta(
                app_label=model_meta_data.app_label,
                model=model_meta_data.model_name,
                query=qs.query,
            ),
        )
        qs_info_list.append(
            QuerySetInfo(
                verbose_name='source model',
                verbose_name_related_model=model_meta_data.verbose_name_plural,
                count=qs.count(),
            ),
        )
        return qs_meta_list, qs_info_list


class TestyArchiveMixin(RelationTreeMixin):
    default_batch_size = 1500

    @preview_schema
    @action(
        methods=['get'],
        url_path='archive/preview',
        url_name='archive-preview',
        detail=True,
    )
    def archive_preview(self, request, pk):
        target_object = self.get_object()
        qs_meta_list, qs_info_list = self.get_objects_to_archive()
        meta_for_caching = MetaForCaching(
            target_object=TargetObject(
                model=target_object._meta.model_name,
                app_label=target_object._meta.app_label,
                pk=target_object.pk,
            ),
            querysets_meta=qs_meta_list,
        )
        cache_key = uuid4().hex
        cache.set(cache_key, meta_for_caching)
        response = Response(data=qs_info_list)
        response.set_cookie('archive_cache', cache_key, max_age=settings.CACHE_TTL)
        return response

    @action(
        methods=[_POST],
        url_path='archive',
        url_name='archive-commit',
        detail=True,
    )
    def archive_objects(self, request, pk):
        querysets_to_archive: list[QuerySet[Model]] = []
        target_object = self.get_object()
        cache_key = request.COOKIES.get('archive_cache')
        if cache_key and cache.get(cache_key):
            meta_to_archive: MetaForCaching = cache.get(cache_key, {})
            if self._get_instance_from_metadata(meta_to_archive.get(_TARGET_OBJECT)) == target_object:
                querysets_to_archive = [
                    self._get_qs_from_meta_data(elem, SoftDeleteQuerySet) for elem in meta_to_archive['querysets_meta']
                ]
            cache.delete(cache_key)
        if not querysets_to_archive:
            meta_objects, _ = self.get_objects_to_archive()
            for meta_data in meta_objects:
                querysets_to_archive.append(self._get_qs_from_meta_data(meta_data, SoftDeleteQuerySet))
        with transaction.atomic():
            for queryset in querysets_to_archive:
                self._update_is_archive(queryset)

        return Response(status=status.HTTP_200_OK)

    @action(
        methods=[_POST],
        url_path='archive/restore',
        url_name='archive-restore',
        detail=False,
    )
    def restore_archived(self, request):
        serializer = RecoveryInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        qs = RecoveryService.get_objects_by_ids(self.get_queryset(), serializer.validated_data)
        model_class = qs.model()
        relation_tree = self.build_relation_tree(model_class)
        qs_meta_list, _ = self.get_all_related_querysets(
            qs,
            model_class,
            relation_tree=relation_tree,
        )
        with transaction.atomic():
            for meta in qs_meta_list:
                try:
                    queryset = self._get_qs_from_meta_data(meta, SoftDeleteQuerySet)
                    queryset.model()._meta.get_field('is_archive')
                except FieldDoesNotExist:
                    continue
                self._update_is_archive(queryset, is_archive=False)
            self._update_is_archive(qs, is_archive=False)

        return Response(status=status.HTTP_200_OK)

    def get_objects_to_archive(self) -> CacheReadyQuerySet:
        config = self._get_config()
        instance = self.get_object()
        qs = RecoveryService.get_objects_by_instance(instance)
        relation_tree = self.build_relation_tree(qs.model)
        qs_meta_list, qs_info_list = self.get_all_related_querysets(
            qs,
            qs.model,
            relation_tree=relation_tree,
        )
        model_meta_data = qs.model()._meta
        qs_meta_list.append(
            QuerySetMeta(
                app_label=model_meta_data.app_label,
                model=model_meta_data.model_name,
                query=qs.query,
            ),
        )
        if config.qs_info_list_required:
            qs_info_list.append(
                QuerySetInfo(
                    verbose_name='source model',
                    verbose_name_related_model=model_meta_data.verbose_name_plural,
                    count=qs.count(),
                ),
            )

        result_meta_list = []
        result_info_list = []
        for meta, info in zip_longest(qs_meta_list, qs_info_list):
            try:
                apps.get_model(
                    meta.get('app_label'),
                    meta.get('model'),
                )._meta.get_field('is_archive')
            except FieldDoesNotExist:
                continue
            result_meta_list.append(meta)
            if info:
                result_info_list.append(info)
        return result_meta_list, result_info_list

    @classmethod
    def _update_is_archive(cls, queryset: QuerySet[Any], is_archive: bool = True):
        table_name = queryset.model._meta.db_table
        ids = list(queryset.values_list('id', flat=True))
        with connection.cursor() as cursor:
            for idx in range(0, len(ids), cls.default_batch_size):
                batch_ids = ids[idx:idx + cls.default_batch_size]
                placeholders = ','.join(['%s'] * len(batch_ids))  # noqa: WPS435
                is_archive_str = 'TRUE' if is_archive else 'FALSE'
                query = (
                    f'UPDATE {table_name} SET is_archive = '  # noqa: S608
                    f'{is_archive_str} WHERE id IN ({placeholders})'  # noqa: WPS326
                )
                cursor.execute(query, batch_ids)
        if getattr(queryset.model, 'history', None):
            create_archive_histories.delay(
                app_label=queryset.model._meta.app_label,
                model_name=queryset.model._meta.model_name,
                ids=ids,
            )


class TestyRestoreModelMixin(RelationTreeMixin):

    @action(
        methods=[_POST],
        url_path='deleted/recover',
        url_name='deleted-recover',
        detail=False,
    )
    def restore(self, request):
        serializer = RecoveryInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        qs = RecoveryService.get_objects_by_ids(self.get_queryset(), serializer.validated_data)
        model_class = qs.model()
        relation_tree = self.build_relation_tree(model_class)
        qs_meta_data, _ = self.get_all_related_querysets(
            qs,
            model_class,
            relation_tree=relation_tree,
        )
        related_querysets = []
        for meta_data in qs_meta_data:
            related_querysets.append(self._get_qs_from_meta_data(meta_data, DeletedQuerySet))
        related_querysets.append(qs)
        with transaction.atomic():
            for related_qs in related_querysets:
                related_qs.restore()
        return Response(status=status.HTTP_200_OK)

    @action(
        methods=['get'],
        url_path='deleted',
        url_name='deleted-list',
        detail=False,
    )
    def recovery_list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        pagination = StandardSetPagination()
        page = pagination.paginate_queryset(queryset, request)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return pagination.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class PayloadFiltersMixin:
    def _filter_queryset_from_request_payload(self, queryset: QuerySet, filter_conditions: dict[str, Any]):
        mocked_request = mock_request_with_query_params(filter_conditions)
        for filter_backend in self.filter_backends:
            queryset = filter_backend().filter_queryset(mocked_request, queryset, self)
        if not self.filterset_class:
            return queryset
        filter_instance = self.filterset_class(mocked_request.GET, queryset, request=mocked_request)
        filter_instance.is_valid()
        return filter_instance.filter_queryset(queryset)


class TestyModelViewSet(  # noqa: WPS215
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    TestyDestroyModelMixin,
    TestyRestoreModelMixin,
    mixins.ListModelMixin,
    GenericViewSet,
):
    """ModelViewSet modified with custom testy mixins."""
