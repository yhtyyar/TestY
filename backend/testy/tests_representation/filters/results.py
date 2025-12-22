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
from django_filters import NumberFilter, OrderingFilter
from django_filters import rest_framework as filters

from testy.core.filters import SearchFilterMixin
from testy.filters import ArchiveFilterMixin, LabelsFilterMetaclass, NumberInFilter, project_filter
from testy.messages.filters import COMMA_SEPARATED_LIST_OR_NULL_MSG, ID_FILTER_MSG, SEARCH_FILTER_MSG
from testy.tests_description.selectors.suites import TestSuiteSelector
from testy.tests_representation.models import ResultStatus, TestResult
from testy.utilities.request import get_boolean

_TEST_CREATED_AT_LOOKUP = 'test__created_at'
_GTE_LOOKUP = 'gte'
_LTE_LOOKUP = 'lte'


class TestResultByPlanFilter(ArchiveFilterMixin, SearchFilterMixin, metaclass=LabelsFilterMetaclass):
    project = NumberFilter()
    created_at_after = filters.DateTimeFilter(field_name=_TEST_CREATED_AT_LOOKUP, lookup_expr=_GTE_LOOKUP)
    created_at_before = filters.DateTimeFilter(field_name=_TEST_CREATED_AT_LOOKUP, lookup_expr=_LTE_LOOKUP)
    assignee = NumberInFilter(field_name='test__assignee_id', help_text=ID_FILTER_MSG)
    unassigned = filters.BooleanFilter(field_name='test__assignee', lookup_expr='isnull')
    suite = NumberInFilter(
        'test__case__suite_id',
        method='filter_by_suite',
        help_text=COMMA_SEPARATED_LIST_OR_NULL_MSG,
    )
    plan = NumberInFilter(field_name='test__plan', help_text='Filter by comma separated list of plan ids')
    last_status = filters.BaseCSVFilter(
        field_name='status_id',
        method='filter_by_last_status',
        help_text=COMMA_SEPARATED_LIST_OR_NULL_MSG,
    )
    search = filters.CharFilter(
        method='filter_by_search',
        help_text=SEARCH_FILTER_MSG.format('title, id'),
    )
    case = NumberInFilter(field_name='test__case_id', help_text='Filter by comma separated list of case ids')
    test_created_after = filters.DateTimeFilter(field_name=_TEST_CREATED_AT_LOOKUP, lookup_expr=_GTE_LOOKUP)
    test_created_before = filters.DateTimeFilter(field_name=_TEST_CREATED_AT_LOOKUP, lookup_expr=_LTE_LOOKUP)
    test_plan_started_after = filters.DateTimeFilter(field_name='test__plan__started_at', lookup_expr=_GTE_LOOKUP)
    test_plan_started_before = filters.DateTimeFilter(field_name='test__plan__started_at', lookup_expr=_LTE_LOOKUP)
    test_plan_created_after = filters.DateTimeFilter(field_name='test__plan__created_at', lookup_expr=_GTE_LOOKUP)
    test_plan_created_before = filters.DateTimeFilter(field_name='test__plan__created_at', lookup_expr=_LTE_LOOKUP)

    labels_outer_ref_prefix = 'test__case'
    search_fields = ['test__case__name', 'test__id']

    @classmethod
    def filter_by_last_status(cls, queryset, field_name: str, statuses):
        local_statuses = deepcopy(statuses)
        filter_conditions = Q(**{f'{field_name}__in': local_statuses})
        if 'null' in local_statuses:
            local_statuses.remove('null')
            filter_conditions |= Q(**{f'{field_name}__isnull': True})
        return queryset.filter(filter_conditions)

    def filter_by_suite(self, queryset, field_name, suite_ids):
        filter_conditons = {f'{field_name}__in': suite_ids}
        if get_boolean(self.request, 'nested_search'):
            suites = TestSuiteSelector.suites_by_ids(suite_ids, 'pk')
            suite_ids = suites.get_descendants(include_self=True).values_list('id', flat=True)
            filter_conditons = {f'{field_name}__in': suite_ids}
        return queryset.filter(**filter_conditons)

    class Meta:
        model = TestResult
        fields = (
            'project',
            'plan',
            'suite',
            'case',
            'assignee',
            'unassigned',
            'last_status',
            'labels',
            'not_labels',
        )


class TestResultFilter(ArchiveFilterMixin):
    project = project_filter()

    class Meta:
        model = TestResult
        fields = ('test',)


class ResultStatusFilter(filters.FilterSet):
    class Meta:
        model = ResultStatus
        fields = ('type',)


class ResultUnionOrderingFilter(filters.FilterSet):
    ordering = OrderingFilter(
        fields=(
            ('created_at', 'created_at'),
        ),
    )
