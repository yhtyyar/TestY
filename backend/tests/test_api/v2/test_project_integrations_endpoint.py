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

import pytest
from django.contrib.contenttypes.models import ContentType
from django.db.models import Model

from tests import constants
from tests.commons import RequestType, model_to_dict_via_serializer
from testy.core.api.v2.serializers import ProjectIntegrationSerializer
from testy.core.models import ProjectIntegration

_PROJECT = 'project'


@pytest.mark.django_db(reset_sequences=True)
class TestProjectIntegrationEndpoints:
    view_name_list = 'api:v2:projectintegration-list'
    view_name_detail = 'api:v2:projectintegration-detail'

    def test_list(self, authorized_client, plan_integration_factory, project):
        expected_instances = []
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            integration = plan_integration_factory(project=project)
            expected_instances.append(model_to_dict_via_serializer(integration, ProjectIntegrationSerializer))

        actual_instances = authorized_client.send_request(
            self.view_name_list,
            query_params={_PROJECT: project.id},
        ).json()['results']
        assert actual_instances == expected_instances

    def test_retrieve(self, authorized_client, plan_integration_factory):
        plan_integration = plan_integration_factory()
        expected_instance = model_to_dict_via_serializer(plan_integration, ProjectIntegrationSerializer)
        actual_instance = authorized_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': plan_integration.pk},
        ).json()
        assert actual_instance == expected_instance

    @pytest.mark.parametrize('is_partial', [True, False])
    def test_update(self, authorized_client, plan_integration_factory, is_partial, project):
        plan_integration = plan_integration_factory()
        new_data = {
            'name': 'Updated Integration',
            'description': 'Updated description',
            'service_url': 'http://updated.url.com',
            'page_type': 'testplan',
        }
        if not is_partial:
            new_data[_PROJECT] = project.id
        authorized_client.send_request(
            self.view_name_detail,
            request_type=RequestType.PATCH if is_partial else RequestType.PUT,
            reverse_kwargs={'pk': plan_integration.pk},
            data=new_data,
        )
        plan_integration.refresh_from_db()
        for field_name in new_data.keys():
            model_field = getattr(plan_integration, field_name)
            if isinstance(model_field, ContentType):
                model_field = model_field.model
            elif isinstance(model_field, Model):
                model_field = model_field.pk
            assert model_field == new_data[field_name]

    def test_creation(self, authorized_client, project):
        payload = {
            'name': 'Updated Integration',
            'description': 'Updated description',
            'service_url': 'http://updated.url.com',
            'page_type': 'testplan',
            _PROJECT: project.id,
        }
        authorized_client.send_request(
            self.view_name_list,
            request_type=RequestType.POST,
            data=payload,
            expected_status=HTTPStatus.CREATED,
        )
        page_type = payload.pop('page_type')
        integration = ProjectIntegration.objects.filter(**payload).first()
        assert integration
        assert integration.page_type.model == page_type
