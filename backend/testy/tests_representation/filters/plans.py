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
import warnings
from functools import partial

from django.db.models import Exists, OuterRef, Q
from django_filters import BaseCSVFilter, NumberFilter
from django_filters import rest_framework as filters
from simple_history.utils import get_history_model_for_model

from testy.core.filters import ParentFilterMixin, SearchFilterMixin
from testy.filters import (
    FilterListMixin,
    NumberInFilter,
    StringInFilter,
    TreeSearchBaseFilter,
    ordering_filter,
    project_filter,
    union_ordering_filter,
)
from testy.messages.filters import (
    COMMA_SEPARATED_LIST_IDS_MSG,
    COMMA_SEPARATED_LIST_OR_NULL_MSG,
    SEARCH_FILTER_MSG,
    TREE_SEARCH_FILTER_MSG,
)
from testy.tests_representation.models import Parameter, TestPlan, TestResult
from testy.tests_representation.selectors.testplan import TestPlanSelector
from testy.tests_representation.selectors.tests import TestSelector
from testy.utilities.request import get_boolean
from testy.utilities.sql import get_max_level
from testy.utilities.string import parse_bool_from_str, parse_int

_PARENT = 'parent'
_FILTER_BY_PARENT = 'filter_by_parent'
_ATTRIBUTES = 'attributes'
_ID = 'id'
_STARTED_AT = 'started_at'
_CREATED_AT = 'created_at'
_NAME = 'name'
_IS_ARCHIVE = 'is_archive'
_PROJECT = 'project'
_PARAMETERS = 'parameters'
_ANY_ATTRIBUTES = 'any_attributes'


class PlanFilter(SearchFilterMixin):
    project = project_filter()
    parameters = NumberInFilter(
        'parameter_ids',
        method='filter_by_parameters',
        help_text=COMMA_SEPARATED_LIST_IDS_MSG,
    )
    parent = filters.CharFilter(
        _PARENT,
        method=_FILTER_BY_PARENT,
        help_text=COMMA_SEPARATED_LIST_OR_NULL_MSG,
    )
    attributes = filters.BaseCSVFilter(
        _ATTRIBUTES,
        lookup_expr='has_keys',
        help_text='Filter by attributes having exact provided keys, as comma separated list',
    )
    any_attributes = filters.BaseCSVFilter(
        _ATTRIBUTES,
        lookup_expr='has_any_keys',
        help_text='Filter by attributes having any of provided keys, as comma separated list',
    )
    treesearch = filters.CharFilter(
        method='filter_by_treesearch',
        help_text=TREE_SEARCH_FILTER_MSG.format('title', _ID),
    )
    search = filters.CharFilter(
        method='filter_by_search',
        help_text=SEARCH_FILTER_MSG.format('title', _ID),
    )
    test_plan_started_after = filters.DateTimeFilter(field_name=_STARTED_AT, lookup_expr='gte')
    test_plan_started_before = filters.DateTimeFilter(field_name=_STARTED_AT, lookup_expr='lte')
    test_plan_created_after = filters.DateTimeFilter(field_name=_CREATED_AT, lookup_expr='gte')
    test_plan_created_before = filters.DateTimeFilter(field_name=_CREATED_AT, lookup_expr='lte')

    ordering = ordering_filter(
        fields=(
            (_STARTED_AT, _STARTED_AT),
            (_CREATED_AT, _CREATED_AT),
            (_NAME, _NAME),
            (_ID, _ID),
        ),
    )
    search_fields = ['title', _ID]

    def filter_by_treesearch(self, qs, field_name, value):
        if not parse_bool_from_str(self.data.get(_IS_ARCHIVE)):
            qs = qs.filter(is_archive=False)
        qs = self.filter_by_search(qs, field_name, value)
        ancestors = qs.get_ancestors(include_self=True)
        ancestors = TestPlanSelector.annotate_title(ancestors)
        return TestPlanSelector.annotate_has_children_with_tests(
            ancestors,
            ancestors.filter(parent_id=OuterRef('pk')),
        )

    @classmethod
    def filter_by_parameters(cls, queryset, field_name, parameter_ids):
        for parameter_id in parameter_ids:
            queryset = queryset.filter(parameters__id=parameter_id)
        return queryset

    @classmethod
    def filter_by_parent(cls, queryset, field_name, parent):
        lookup = Q()
        if parent == 'null':
            lookup = Q(**{f'{field_name}__isnull': True})
        elif parent_id := parse_int(parent):
            lookup = Q(**{f'{field_name}__id': parent_id})
        return queryset.filter(lookup)

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        if not parse_bool_from_str(self.data.get(_IS_ARCHIVE)):
            queryset = queryset.filter(is_archive=False)
        return queryset

    class Meta:
        model = TestPlan
        fields = (
            _PROJECT,
            'treesearch',
            'search',
            _PARAMETERS,
            _PARENT,
            _ATTRIBUTES,
            _ANY_ATTRIBUTES,
            'ordering',
            'test_plan_started_after',
            'test_plan_started_before',
            'test_plan_created_after',
            'test_plan_created_before',
        )


class PlanProjectParentFilter(ParentFilterMixin):
    project = project_filter()
    parent = filters.CharFilter(
        _PARENT,
        method=_FILTER_BY_PARENT,
        help_text=COMMA_SEPARATED_LIST_OR_NULL_MSG,
    )

    class Meta:
        model = TestPlan
        fields = (_PROJECT, _PARENT)


class PlanUnionFilter(PlanFilter):
    ordering = None
    parent = filters.CharFilter(
        _PARENT,
        method=_FILTER_BY_PARENT,
        required=True,
        help_text=COMMA_SEPARATED_LIST_OR_NULL_MSG,
    )

    @classmethod
    def filter_by_parent(cls, queryset, field_name, parent):
        lookup = Q()
        if parent == 'null':
            lookup = Q(**{f'{field_name}__isnull': True})
        elif parent_id := parse_int(parent):
            lookup = Q(**{f'{field_name}__id': parent_id})
        return queryset.filter(lookup)

    class Meta(PlanFilter.Meta):
        fields = (
            _PROJECT,
            'treesearch',
            'search',
            _PARAMETERS,
            _PARENT,
            _ATTRIBUTES,
            _ANY_ATTRIBUTES,
            'test_plan_started_after',
            'test_plan_started_before',
            'test_plan_created_after',
            'test_plan_created_before',
        )


class PlanUnionOrderingFilter(filters.FilterSet):
    ordering = union_ordering_filter(
        fields=(
            (_ID, _ID),
            ('is_leaf', 'is_leaf'),
            (_STARTED_AT, _STARTED_AT),
            (_CREATED_AT, _CREATED_AT),
            (_NAME, _NAME),
            ('union_assignee_username', 'assignee_username'),
            ('union_suite_path', 'suite_path'),
            (('union_estimate', _ID), 'estimate'),
        ),
    )


class PlanUnionFilterNoSearch(PlanFilter):
    ordering = None
    search = None
    treesearch = None

    class Meta(PlanFilter.Meta):
        fields = (
            _PROJECT,
            _PARAMETERS,
            _PARENT,
            _ATTRIBUTES,
            _ANY_ATTRIBUTES,
            'test_plan_started_after',
            'test_plan_started_before',
            'test_plan_created_after',
            'test_plan_created_before',
        )


class ParameterFilter(filters.FilterSet):
    project = project_filter()

    class Meta:
        model = Parameter
        fields = (_PROJECT,)


class ActivityFilter(SearchFilterMixin, FilterListMixin):
    history_user = NumberInFilter(field_name='history_user', help_text='Filter by comma separated list of user ids')
    status = BaseCSVFilter(field_name='status', method='filter_by_list', help_text=COMMA_SEPARATED_LIST_OR_NULL_MSG)
    history_type = StringInFilter(
        field_name='history_type',
        help_text='Filter by comma separated list that can contain +,~,- matches added, modified, deleted',
    )
    test = NumberInFilter(field_name='test', help_text=COMMA_SEPARATED_LIST_IDS_MSG)
    ordering = ordering_filter(
        fields=(
            ('history_user', 'history_user'),
            ('history_date', 'history_date'),
            ('history_type', 'history_type'),
            ('test__case__name', 'test__case__name'),
        ),
    )
    search = filters.CharFilter(
        method='filter_by_search',
        help_text=SEARCH_FILTER_MSG.format('username, case name, histoical record date'),
    )

    search_fields = ['history_user__username', 'test__case__name', 'history_date']

    class Meta:
        model = get_history_model_for_model(TestResult)
        fields = (_ID,)


class TestPlanSearchFilter(TreeSearchBaseFilter):
    def __init__(self, *args, **kwargs):
        warnings.warn('Deprecated in 2.0', DeprecationWarning, stacklevel=2)
        super().__init__(*args, **kwargs)

    children_field_name = 'child_test_plans'
    max_level_method = partial(get_max_level, TestPlan)
    model_class = TestPlan

    def get_ancestors(self, valid_options):
        return super().get_ancestors(valid_options).prefetch_related(_PARAMETERS)

    def get_valid_options(self, filter_conditions, request):
        additional_filters = {
            'project_id': request.query_params.get(_PROJECT),
        }
        if not get_boolean(request, _IS_ARCHIVE):
            additional_filters[_IS_ARCHIVE] = False
        qs = TestPlanSelector.annotate_title(TestPlanSelector.testplan_list_raw())
        return qs.filter(filter_conditions, **additional_filters)


class PlanFilterV1(filters.FilterSet):
    def __init__(self, *args, **kwargs):
        warnings.warn('Dont use in new code, only for backward compatibility', DeprecationWarning, stacklevel=2)
        super().__init__(*args, **kwargs)

    project = project_filter()
    parameters = filters.BaseCSVFilter('parameter_ids', method='filter_by_parameters')
    parent = filters.CharFilter(_PARENT, method=_FILTER_BY_PARENT)
    attributes = filters.BaseCSVFilter(_ATTRIBUTES, lookup_expr='has_keys')
    any_attributes = filters.BaseCSVFilter(_ATTRIBUTES, lookup_expr='has_any_keys')
    ordering = ordering_filter(
        fields=(
            (_STARTED_AT, _STARTED_AT),
            (_CREATED_AT, _CREATED_AT),
            (_NAME, _NAME),
            (_ID, _ID),
        ),
    )

    @classmethod
    def filter_by_parameters(cls, queryset, field_name, parameter_ids):
        for parameter_id in parameter_ids:
            queryset = queryset.filter(parameters__id=parameter_id)
        return queryset

    @classmethod
    def filter_by_parent(cls, queryset, field_name, parent):
        lookup = Q()
        if parent == 'null':
            lookup = Q(**{f'{field_name}__isnull': True})
        elif parent_id := parse_int(parent):
            lookup = Q(**{f'{field_name}__id': parent_id})
        return queryset.filter(lookup)

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        if not parse_bool_from_str(self.data.get(_IS_ARCHIVE)):
            queryset = queryset.filter(is_archive=False)
        return queryset

    class Meta:
        model = TestPlan
        fields = (_PROJECT, _PARAMETERS, _PARENT, _ATTRIBUTES, _ANY_ATTRIBUTES, 'ordering')


class PlanAssigneeProgressFilter(PlanUnionFilter):
    assignee = NumberFilter(method='filter_by_assignee', required=True)

    def filter_by_assignee(self, queryset, field_name, assignee_id):
        assigned_tests_sq = TestSelector.tests_by_parent_plan_subquery(assignee_id=assignee_id)
        return queryset.alias(has_tests=Exists(assigned_tests_sq)).filter(has_tests=True)
