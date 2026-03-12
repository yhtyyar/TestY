from rest_framework.exceptions import ValidationError

from testy.tests_representation.choices import TestPlanStatus

VALID_TRANSITIONS = {
    TestPlanStatus.DRAFT: [TestPlanStatus.ACTIVE],
    TestPlanStatus.ACTIVE: [TestPlanStatus.COMPLETED, TestPlanStatus.DRAFT],
    TestPlanStatus.COMPLETED: [TestPlanStatus.ARCHIVED, TestPlanStatus.ACTIVE],
    TestPlanStatus.ARCHIVED: [],
}


def validate_status_transition(current_status, new_status):
    """Validate that the transition between two TestPlan statuses is allowed."""
    allowed = VALID_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        current_label = TestPlanStatus(current_status).label
        new_label = TestPlanStatus(new_status).label
        raise ValidationError(
            {'status': f'Transition from {current_label} to {new_label} is not allowed.'},
        )
