# TestY TMS - Test Management System
# Copyright (C) 2022 KNS Group LLC (YADRO)
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
import logging

from django.core.management import BaseCommand
from django.db import connection

logger = logging.getLogger(__name__)

UPDATE_LABEL_IDS_SQL = """
    with
        select_config as (
            select id as content_type_id
        from django_content_type
        where app_label = 'tests_description'
            and model = 'testcase'
    ),
    cte as (
        select
            object_id,
            ARRAY_AGG(label_id ORDER BY label_id) as array_agg,
            ROW_NUMBER() OVER (PARTITION BY object_id ORDER BY content_object_history_id DESC) as rank_in_group
        from core_labeleditem
        where content_type_id = (select content_type_id from select_config)
            and is_deleted = false
        group by object_id, content_object_history_id
    )
    UPDATE core_labelids
        SET ids = cte.array_agg
    FROM cte
    WHERE core_labelids.object_id = cte.object_id
        AND core_labelids.content_type_id = (select content_type_id from select_config)
        AND cte.rank_in_group = 1
        AND NOT (core_labelids.ids <@ cte.array_agg AND cte.array_agg <@ core_labelids.ids)
"""


class Command(BaseCommand):
    help = 'Update label IDs in core_labelids based on core_labeleditem'

    def handle(self, *args, **options) -> None:
        logger.info('Starting label IDs update...')

        with connection.cursor() as cursor:
            cursor.execute(UPDATE_LABEL_IDS_SQL)
            updated_count = cursor.rowcount

            logger.info(f'Successfully updated {updated_count} records')
