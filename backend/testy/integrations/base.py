from abc import ABC, abstractmethod
from typing import Any


class IssueTracker(ABC):
    """Abstract base class for issue tracker integrations (Jira, GitLab, etc.)."""

    @abstractmethod
    def create_issue(self, title: str, description: str, project_key: str, **kwargs) -> dict[str, Any]:
        """Create a new issue in the tracker."""

    @abstractmethod
    def get_issue(self, issue_id: str) -> dict[str, Any]:
        """Retrieve an issue by its ID."""

    @abstractmethod
    def update_issue_status(self, issue_id: str, status: str) -> dict[str, Any]:
        """Update the status of an existing issue."""

    @abstractmethod
    def search_issues(self, query: str, project_key: str) -> list[dict[str, Any]]:
        """Search for issues matching a query."""

    @abstractmethod
    def test_connection(self) -> bool:
        """Verify that the connection to the tracker is working."""
