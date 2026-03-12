import pytest

from testy.integrations.base import IssueTracker


class TestIssueTrackerInterface:

    def test_issue_tracker_is_abstract(self):
        with pytest.raises(TypeError):
            IssueTracker()

    def test_concrete_implementation_works(self):
        class DummyTracker(IssueTracker):
            def create_issue(self, title, description, project_key, **kwargs):
                return {'id': '1', 'title': title}

            def get_issue(self, issue_id):
                return {'id': issue_id}

            def update_issue_status(self, issue_id, status):
                return {'id': issue_id, 'status': status}

            def search_issues(self, query, project_key):
                return []

            def test_connection(self):
                return True

        tracker = DummyTracker()
        assert tracker.test_connection() is True
        assert tracker.create_issue('Bug', 'desc', 'PROJ')['title'] == 'Bug'
        assert tracker.get_issue('1')['id'] == '1'
        assert tracker.update_issue_status('1', 'closed')['status'] == 'closed'
        assert tracker.search_issues('query', 'PROJ') == []

    def test_partial_implementation_raises(self):
        class IncompleteTracker(IssueTracker):
            def create_issue(self, title, description, project_key, **kwargs):
                return {}

        with pytest.raises(TypeError):
            IncompleteTracker()
