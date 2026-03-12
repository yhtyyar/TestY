import pytest
from rest_framework.exceptions import ValidationError

from tests.factories import ProjectFactory, TestPlanFactory
from testy.tests_representation.choices import TestPlanStatus
from testy.tests_representation.state_machine import validate_status_transition


@pytest.mark.django_db
class TestTestPlanStatus:

    def test_default_status_is_draft(self):
        project = ProjectFactory()
        plan = TestPlanFactory(project=project)
        assert plan.status == TestPlanStatus.DRAFT

    def test_status_choices_available(self):
        choices = [c[0] for c in TestPlanStatus.choices]
        assert TestPlanStatus.DRAFT in choices
        assert TestPlanStatus.ACTIVE in choices
        assert TestPlanStatus.COMPLETED in choices
        assert TestPlanStatus.ARCHIVED in choices


class TestStateMachine:

    def test_valid_transition_draft_to_active(self):
        validate_status_transition(TestPlanStatus.DRAFT, TestPlanStatus.ACTIVE)

    def test_valid_transition_active_to_completed(self):
        validate_status_transition(TestPlanStatus.ACTIVE, TestPlanStatus.COMPLETED)

    def test_valid_transition_active_to_draft(self):
        validate_status_transition(TestPlanStatus.ACTIVE, TestPlanStatus.DRAFT)

    def test_valid_transition_completed_to_archived(self):
        validate_status_transition(TestPlanStatus.COMPLETED, TestPlanStatus.ARCHIVED)

    def test_valid_transition_completed_to_active(self):
        validate_status_transition(TestPlanStatus.COMPLETED, TestPlanStatus.ACTIVE)

    def test_invalid_transition_draft_to_completed(self):
        with pytest.raises(ValidationError):
            validate_status_transition(TestPlanStatus.DRAFT, TestPlanStatus.COMPLETED)

    def test_invalid_transition_draft_to_archived(self):
        with pytest.raises(ValidationError):
            validate_status_transition(TestPlanStatus.DRAFT, TestPlanStatus.ARCHIVED)

    def test_invalid_transition_archived_to_any(self):
        for target in [TestPlanStatus.DRAFT, TestPlanStatus.ACTIVE, TestPlanStatus.COMPLETED]:
            with pytest.raises(ValidationError):
                validate_status_transition(TestPlanStatus.ARCHIVED, target)

    def test_invalid_transition_completed_to_draft(self):
        with pytest.raises(ValidationError):
            validate_status_transition(TestPlanStatus.COMPLETED, TestPlanStatus.DRAFT)
