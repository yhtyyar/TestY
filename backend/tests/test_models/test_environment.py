import pytest
from django.db import IntegrityError

from tests.factories import EnvironmentFactory, ProjectFactory
from testy.core.models import Environment


@pytest.mark.django_db
class TestEnvironmentModel:

    def test_create_environment(self):
        project = ProjectFactory()
        env = EnvironmentFactory(project=project, name='Staging')
        assert env.pk is not None
        assert env.name == 'Staging'
        assert env.project == project
        assert env.is_active is True

    def test_environment_str(self):
        env = EnvironmentFactory(name='Production')
        assert str(env) == 'Production'

    def test_environment_belongs_to_project(self):
        project = ProjectFactory()
        env = EnvironmentFactory(project=project)
        assert env.project_id == project.pk

    def test_environment_default_is_active(self):
        env = EnvironmentFactory()
        assert env.is_active is True

    def test_environment_description_blank(self):
        env = EnvironmentFactory(description='')
        assert env.description == ''

    def test_multiple_environments_per_project(self):
        project = ProjectFactory()
        env1 = EnvironmentFactory(project=project, name='Dev')
        env2 = EnvironmentFactory(project=project, name='Staging')
        assert Environment.objects.filter(project=project).count() == 2

    def test_same_name_different_projects(self):
        p1 = ProjectFactory()
        p2 = ProjectFactory()
        EnvironmentFactory(project=p1, name='Staging')
        EnvironmentFactory(project=p2, name='Staging')
        assert Environment.objects.filter(name='Staging').count() == 2
