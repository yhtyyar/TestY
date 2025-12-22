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

from django.db.models import Q
from django_filters import NumberFilter
from django_filters import rest_framework as filters

from testy.core.filters import SearchFilterMixin
from testy.filters import (
    ArchiveFilterMixin,
    IsFilteredMixin,
    LabelsFilterMetaclass,
    NumberInFilter,
    ordering_filter,
    project_filter,
)
from testy.messages.filters import (
    CASE_INSENSITIVE_TEXT_MSG,
    COMMA_SEPARATED_LIST_OR_NULL_MSG,
    ID_FILTER_MSG,
    SEARCH_FILTER_MSG,
)
from testy.tests_description.selectors.suites import TestSuiteSelector
from testy.tests_representation.models import Test
from testy.utilities.request import get_boolean

_LAST_STATUS = 'last_status'
_ASSIGNEE = 'assignee'
_CREATED_AT = 'created_at'
_GTE_LOOKUP = 'gte'
_LTE_LOOKUP = 'lte'
_PLAN = 'plan'
_CASE = 'case'
_CASE_NAME_LOOKUP = 'case__name'
_ID = 'id'
_NULL = 'null'
_PROJECT = 'project'
_IN_POSTFIX = '__in'


class UnionTestFilter(ArchiveFilterMixin, IsFilteredMixin, SearchFilterMixin, metaclass=LabelsFilterMetaclass):
    last_status = filters.BaseCSVFilter(
        field_name=_LAST_STATUS,
        method='filter_by_last_status',
        help_text=COMMA_SEPARATED_LIST_OR_NULL_MSG,
    )
    assignee = NumberInFilter(help_text=ID_FILTER_MSG)
    unassigned = filters.BooleanFilter(field_name=_ASSIGNEE, lookup_expr='isnull')
    assignee_username = filters.CharFilter(
        'assignee__username',
        lookup_expr='icontains',
        help_text=CASE_INSENSITIVE_TEXT_MSG,
    )
    suite_path = filters.CharFilter(
        'suite_path',
        lookup_expr='icontains',
        help_text=CASE_INSENSITIVE_TEXT_MSG,
    )
    search = filters.CharFilter(
        method='filter_by_search',
        help_text=SEARCH_FILTER_MSG.format('name, id'),
    )
    test_created_after = filters.DateTimeFilter(field_name=_CREATED_AT, lookup_expr=_GTE_LOOKUP)
    test_created_before = filters.DateTimeFilter(field_name=_CREATED_AT, lookup_expr=_LTE_LOOKUP)
    plan = NumberInFilter(field_name=_PLAN, help_text='Filter by comma separated list of plan ids')
    suite = NumberInFilter(field_name='case__suite', help_text='Filter by comma separated list of suite ids')
    treesearch = filters.CharFilter(
        method='filter_by_search',
        help_text=SEARCH_FILTER_MSG.format('name'),
    )

    labels_outer_ref_prefix = _CASE
    search_fields = [_CASE_NAME_LOOKUP, _ID]

    @classmethod
    def filter_by_last_status(cls, queryset, field_name: str, statuses):
        local_statuses = deepcopy(statuses)
        filter_conditions = Q(**{f'{field_name}{_IN_POSTFIX}': local_statuses})
        if _NULL in local_statuses:
            local_statuses.remove(_NULL)
            filter_conditions |= Q(**{f'{field_name}__isnull': True})
        return queryset.filter(filter_conditions)

    class Meta:
        model = Test
        fields = (_PROJECT, _PLAN, _ASSIGNEE)


class TestOrderingFilter(filters.FilterSet):
    ordering = ordering_filter(
        fields=(
            (_ID, _ID),
            (_LAST_STATUS, _LAST_STATUS),
            (_CREATED_AT, _CREATED_AT),
            (_CASE_NAME_LOOKUP, 'name'),
            ('is_archive', 'is_archive'),
            (_ASSIGNEE, _ASSIGNEE),
            ('assignee__username', 'assignee_username'),
            ('case__suite__path', 'suite_path'),
            ('case__estimate', 'estimate'),
            (('plan__started_at', _ID), 'started_at'),
        ),
    )


class TestFilter(ArchiveFilterMixin, SearchFilterMixin, TestOrderingFilter, metaclass=LabelsFilterMetaclass):
    project = project_filter()
    assignee = NumberInFilter(help_text=ID_FILTER_MSG)
    unassigned = filters.BooleanFilter(field_name=_ASSIGNEE, lookup_expr='isnull')
    suite = NumberInFilter('case__suite_id', method='filter_by_suite', help_text=COMMA_SEPARATED_LIST_OR_NULL_MSG)
    plan = NumberInFilter(field_name=_PLAN, help_text='Filter by comma separated list of plan ids')
    last_status = filters.BaseCSVFilter(
        field_name=_LAST_STATUS,
        method='filter_by_last_status',
        help_text=COMMA_SEPARATED_LIST_OR_NULL_MSG,
    )
    search = filters.CharFilter(
        method='filter_by_search',
        help_text=SEARCH_FILTER_MSG.format('title, id'),
    )
    case = NumberInFilter(field_name=_CASE, help_text='Filter by comma separated list of case ids')

    labels_outer_ref_prefix = _CASE
    search_fields = [_CASE_NAME_LOOKUP, _ID]

    def filter_by_suite(self, queryset, field_name, suite_ids):
        filter_conditons = {f'{field_name}{_IN_POSTFIX}': suite_ids}
        if get_boolean(self.request, 'nested_search'):
            suites = TestSuiteSelector.suites_by_ids(suite_ids, 'pk')
            suite_ids = suites.get_descendants(include_self=True).values_list(_ID, flat=True)
            filter_conditons = {f'{field_name}{_IN_POSTFIX}': suite_ids}
        return queryset.filter(**filter_conditons)

    @classmethod
    def filter_by_last_status(cls, queryset, field_name: str, statuses):
        local_statuses = deepcopy(statuses)
        filter_conditions = Q(**{f'{field_name}{_IN_POSTFIX}': local_statuses})
        if _NULL in local_statuses:
            local_statuses.remove(_NULL)
            filter_conditions |= Q(**{f'{field_name}__isnull': True})
        return queryset.filter(filter_conditions)

    def filter_queryset(self, queryset):
        qs = super().filter_queryset(queryset)
        if not self.request.query_params.get('ordering'):
            qs = qs.order_by(_CASE_NAME_LOOKUP)
        return qs

    class Meta:
        model = Test
        fields = (
            _PROJECT,
            _PLAN,
            _CASE,
            'suite',
            _ASSIGNEE,
            'unassigned',
            _LAST_STATUS,
            'labels',
            'not_labels',
            'ordering',
            'search',
        )


class TestsByPlanFilter(TestFilter):
    project = NumberFilter()
    test_created_after = filters.DateTimeFilter(field_name=_CREATED_AT, lookup_expr=_GTE_LOOKUP)
    test_created_before = filters.DateTimeFilter(field_name=_CREATED_AT, lookup_expr=_LTE_LOOKUP)
    test_plan_started_after = filters.DateTimeFilter(field_name='plan__started_at', lookup_expr=_GTE_LOOKUP)
    test_plan_started_before = filters.DateTimeFilter(field_name='plan__started_at', lookup_expr=_LTE_LOOKUP)
    test_plan_created_after = filters.DateTimeFilter(field_name='plan__created_at', lookup_expr=_GTE_LOOKUP)
    test_plan_created_before = filters.DateTimeFilter(field_name='plan__created_at', lookup_expr=_LTE_LOOKUP)

    @classmethod
    def filter_by_last_status(cls, queryset, field_name: str, statuses):
        local_statuses = deepcopy(statuses)
        filter_conditions = Q(**{f'{field_name}{_IN_POSTFIX}': local_statuses})
        if _NULL in local_statuses:
            local_statuses.remove(_NULL)
            filter_conditions |= Q(**{f'{field_name}__isnull': True})
        return queryset.filter(filter_conditions)

    class Meta:
        model = Test
        fields = (
            _PROJECT,
            _PLAN,
            'suite',
            _CASE,
            _ASSIGNEE,
            'unassigned',
            _LAST_STATUS,
            'labels',
            'not_labels',
            'ordering',
        )


class TestFilterNested(TestFilter):
    project = filters.NumberFilter(_PROJECT)


class TestWithoutProjectFilter(TestFilter):
    project = None
