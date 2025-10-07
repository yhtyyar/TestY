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

from http import HTTPStatus

from django.http import HttpRequest
from rest_framework.response import Response

from testy.tests_description.selectors.cases import TestCaseSelector


class TestCaseVersionRedirectMixin:

    @staticmethod
    def is_need_version_redirect(request: HttpRequest) -> bool:  # noqa: WPS602
        return bool(request.query_params.get('version'))

    def version_redirect(self, request: HttpRequest) -> Response:
        query_dict = request.query_params.copy()
        version = query_dict.get('version')
        query_dict.pop('version')

        instance = self.get_object()
        _, version = TestCaseSelector.case_by_version(instance, version)
        display_version = TestCaseSelector.get_display_version_by_version(
            instance.id,
            int(version),
        )
        query_dict['ver'] = display_version
        new_url = f'{request.path}?{query_dict.urlencode()}'
        return Response(
            status=HTTPStatus.PERMANENT_REDIRECT,
            headers={'Location': new_url},
        )
