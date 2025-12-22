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
from django_filters import CharFilter, NumberFilter
from django_filters import rest_framework as filters
from simple_history.utils import get_history_model_for_model

from testy.core.filters import SearchFilterMixin
from testy.filters import (
    ArchiveFilterMixin,
    IsFilteredMixin,
    LabelsFilterMetaclass,
    NumberInFilter,
    case_insensitive_filter,
    ordering_filter,
    project_filter,
)
from testy.messages.filters import SEARCH_FILTER_MSG
from testy.tests_description.models import TestCase, TestSuite
from testy.utilities.request import get_boolean

_ID = 'id'
_CREATED_AT = 'created_at'
_NAME = 'name'


class TestCaseFilter(SearchFilterMixin, ArchiveFilterMixin, metaclass=LabelsFilterMetaclass):
    project = project_filter()
    name = case_insensitive_filter()
    ordering = ordering_filter(
        fields=(
            (_ID, _ID),
            (_NAME, _NAME),
            ('title', 'title'),
            (_CREATED_AT, _CREATED_AT),
            ('estimate', 'estimate'),
        ),
    )
    search = CharFilter(method='filter_by_search', help_text=SEARCH_FILTER_MSG.format('name, id'))
    suite = NumberInFilter(method='filter_by_suite')
    test_case_created_after = filters.DateTimeFilter(field_name=_CREATED_AT, lookup_expr='gte')
    test_case_created_before = filters.DateTimeFilter(field_name=_CREATED_AT, lookup_expr='lte')

    search_fields = [_NAME, _ID]
    labels_outer_ref_prefix = None

    def filter_by_suite(self, queryset, field_name, suite_ids):
        if get_boolean(self.request, 'show_descendants'):
            suites = TestSuite.objects.filter(id__in=suite_ids).get_descendants(include_self=True)
            suite_ids = suites.values_list(_ID, flat=True)
        queryset = queryset.filter(suite_id__in=suite_ids)
        if not self.request.query_params.get('ordering'):
            queryset = queryset.order_by(_NAME)
        return queryset

    class Meta:
        model = TestCase
        fields = (_ID, 'project', 'suite', _NAME, 'search', 'test_case_created_after', 'test_case_created_before')


class TestCaseFilterSearch(SearchFilterMixin, ArchiveFilterMixin, metaclass=LabelsFilterMetaclass):
    project = project_filter()
    name = case_insensitive_filter()
    labels_outer_ref_prefix = None
    search = filters.CharFilter(method='filter_by_search', help_text=SEARCH_FILTER_MSG.format('name, id'))

    search_fields = [_NAME, _ID]


class TestCaseHistoryFilter(filters.FilterSet):
    ordering = ordering_filter(
        fields=(
            ('history_date', 'history_date'),
            ('history_user', 'history_user'),
            ('history_type', 'history_type'),
        ),
    )

    class Meta:
        model = get_history_model_for_model(TestCase)
        fields = (_ID,)


class TestCaseWithoutProjectFilter(TestCaseFilter):
    project = None


class UnionCaseFilter(SearchFilterMixin, ArchiveFilterMixin, IsFilteredMixin, metaclass=LabelsFilterMetaclass):
    project = project_filter()
    search = CharFilter(method='filter_by_search', help_text=SEARCH_FILTER_MSG.format('name, id'))
    test_case_created_after = filters.DateTimeFilter(field_name=_CREATED_AT, lookup_expr='gte')
    test_case_created_before = filters.DateTimeFilter(field_name=_CREATED_AT, lookup_expr='lte')
    suite = NumberInFilter('suite', help_text='Comma separated list of test suite ids')

    labels_outer_ref_prefix = None
    search_fields = [_NAME, _ID]


class CasesBySuiteFilter(TestCaseFilter):
    project = NumberFilter()
