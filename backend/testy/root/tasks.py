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
import datetime
import json
from http import HTTPStatus
from logging import getLogger

import requests
from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.files.base import ContentFile
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from testy.root.auth.models import TTLToken

logger = getLogger()
UserModel = get_user_model()


@shared_task(bind=True)
def debug_task(self):
    logger.info(f'Request: {self.request!r}')


@shared_task(bind=True)
def project_access_email(self, subject: str, message: str, recipients: list[str]):
    send_mail(
        subject,
        message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipients,
    )


@shared_task(bind=True)
@transaction.atomic
def delete_expired_tokens(self):
    TTLToken.objects.filter(expiration_date__lt=timezone.now()).delete()
    return f'Completed deleting expired tokens at {timezone.now()}'


@shared_task(bind=True, default_retry_delay=10 * 60, max_retries=3)
def migrate_avatar_from_team_yadro(self, user_id: int):
    default_timeout = 300
    user = UserModel.objects.get(id=user_id)
    team_yadro_url = f'https://team.yadro.com/wp-json/userimage/v1/user/{user.username}'
    logger.info(f'Trying to retrieve avatar for user {user.username}')
    response = requests.get(team_yadro_url, timeout=default_timeout)

    if response.status_code == HTTPStatus.NOT_FOUND:
        logger.warning(f'Avatar for "{user.username}" not found in team yadro')
        return

    if response.status_code != HTTPStatus.OK:
        logger.warning(f'Failed to fetch info about user "{user.username}" got {response.status_code} from team yadro')
        self.retry()

    image_url = json.loads(response.content)['images']['full']
    if not image_url:
        return
    image_response = requests.get(image_url, stream=True, timeout=default_timeout)
    if response.status_code != HTTPStatus.OK:
        logger.warning(f'Failed to fetch image for user "{user.username}" got {response.status_code} from team yadro')
        self.retry()
    timestamp = str(datetime.datetime.now())
    name = f'{user.username}{timestamp}.png'
    new_avatar = ContentFile(image_response.content, name=name)
    user.avatar = new_avatar
    user.save()
    logger.info(f'Successfully fetched avatar for "{user.username}".')


@shared_task(name='create_archive_histories')
def create_archive_histories(app_label: str, model_name: str, ids: list[int]):
    batch_size = 1000
    logger.info(f'Creating archive histories for {model_name}')
    content_type = ContentType.objects.get(model=model_name, app_label=app_label)
    model = content_type.model_class()
    queryset = model.objects.filter(id__in=ids)
    queryset.model.history.bulk_history_create(
        queryset,
        batch_size=batch_size,
        update=True,
    )
