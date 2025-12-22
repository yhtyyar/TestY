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

from django.db.models import Model, QuerySet

from testy.root.auth.models import TTLToken


class TTLTokenSelector:
    @classmethod
    def token_list_by_user_id(cls, user_id: int) -> QuerySet[TTLToken]:
        return TTLToken.objects.filter(user__pk=user_id)


class BulkUpdateSelector:
    @classmethod
    def list_for_bulk_operation(
        cls,
        queryset: QuerySet[Model],
        included_objects: list[Model] | None,
        excluded_objects: list[Model] | None,
        lookup: str | None = 'pk__in',
        include_descendants: bool = False,
    ) -> QuerySet[Model]:
        if not any([included_objects, excluded_objects]):
            return queryset
        model = type(included_objects[0]) if included_objects else type(excluded_objects[0])
        subquery = model.objects.values_list('pk', flat=True)
        if included_objects:
            include_subquery = subquery.filter(pk__in=[obj.id for obj in included_objects])
            if include_descendants and hasattr(include_subquery, 'get_descendants'):
                include_subquery = include_subquery.get_descendants(include_self=True)
            queryset = queryset.filter(**{lookup: include_subquery})
        if excluded_objects:
            exclude_subquery = subquery.filter(pk__in=[obj.id for obj in excluded_objects])
            if include_descendants and hasattr(exclude_subquery, 'get_descendants'):
                exclude_subquery = exclude_subquery.get_descendants(include_self=True)
            queryset = queryset.exclude(**{lookup: exclude_subquery})
        return queryset

    @classmethod
    def list_for_bulk_operation_tree(
        cls,
        queryset: QuerySet[Model],
        related_field: str,
        included_related_objects: list[Model] | None,
        included_objects: list[Model] | None,
    ) -> QuerySet[Model]:
        included_queryset = None
        related_queryset = None
        if included_objects:
            included_queryset = cls.list_for_bulk_operation(
                queryset=deepcopy(queryset),
                included_objects=included_objects,
                excluded_objects=None,
            )
        if included_related_objects:
            related_queryset = cls.list_for_bulk_operation(
                queryset=deepcopy(queryset),
                included_objects=included_related_objects,
                lookup=f'{related_field}__in',
                include_descendants=True,
                excluded_objects=None,
            )
        if all([included_queryset, related_queryset]):
            return included_queryset | related_queryset
        elif any([included_queryset, related_queryset]):
            return included_queryset or related_queryset
        return queryset
