import pytest
from django.conf import settings
from django.test import RequestFactory, override_settings
from rest_framework.test import APIClient

from tests.factories import UserFactory


# ---------------------------------------------------------------------------
# CORS integration tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestCORSHeaders:
    """Verify that Django corsheaders middleware returns correct headers."""

    def _options(self, origin, path='/api/v2/'):
        client = APIClient()
        return client.options(
            path,
            HTTP_ORIGIN=origin,
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='GET',
        )

    def _get(self, origin, path='/api/v2/'):
        client = APIClient()
        return client.get(path, HTTP_ORIGIN=origin)

    @override_settings(
        CORS_ALLOWED_ORIGINS=['http://testallowed.example.com'],
        CORS_ALLOW_ALL_ORIGINS=False,
    )
    def test_preflight_allowed_origin_returns_acao_header(self):
        """OPTIONS preflight from an allowed origin gets Access-Control-Allow-Origin."""
        response = self._options('http://testallowed.example.com')
        assert response.get('Access-Control-Allow-Origin') == 'http://testallowed.example.com'

    @override_settings(
        CORS_ALLOWED_ORIGINS=['http://testallowed.example.com'],
        CORS_ALLOW_ALL_ORIGINS=False,
    )
    def test_preflight_disallowed_origin_has_no_acao_header(self):
        """OPTIONS preflight from a foreign origin gets no Access-Control-Allow-Origin."""
        response = self._options('http://evil.example.com')
        assert response.get('Access-Control-Allow-Origin') is None

    @override_settings(
        CORS_ALLOWED_ORIGINS=['http://testallowed.example.com'],
        CORS_ALLOW_ALL_ORIGINS=False,
        CORS_ALLOW_CREDENTIALS=True,
    )
    def test_simple_request_allowed_origin_returns_acao(self):
        """A simple GET from an allowed origin gets Access-Control-Allow-Origin."""
        response = self._get('http://testallowed.example.com')
        assert response.get('Access-Control-Allow-Origin') == 'http://testallowed.example.com'

    @override_settings(
        CORS_ALLOW_ALL_ORIGINS=False,
        CORS_ALLOWED_ORIGINS=['http://testallowed.example.com'],
        CORS_ALLOW_CREDENTIALS=True,
    )
    def test_allow_credentials_header_present(self):
        """Access-Control-Allow-Credentials must be 'true' for credentialed requests."""
        response = self._get('http://testallowed.example.com')
        assert response.get('Access-Control-Allow-Credentials') == 'true'

    def test_cors_allow_all_origins_not_enabled(self):
        """Wildcard CORS must never be enabled (security requirement)."""
        assert not getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False)

    def test_cors_allowed_origins_configured(self):
        assert isinstance(settings.CORS_ALLOWED_ORIGINS, list)
        assert len(settings.CORS_ALLOWED_ORIGINS) > 0

    def test_cors_allowed_origins_use_valid_scheme(self):
        for origin in settings.CORS_ALLOWED_ORIGINS:
            assert origin.startswith('http://') or origin.startswith('https://'), (
                f'CORS origin {origin!r} must start with http:// or https://'
            )

    def test_cors_credentials_enabled(self):
        assert settings.CORS_ALLOW_CREDENTIALS is True

    def test_csrf_trusted_origins_configured(self):
        trusted = getattr(settings, 'CSRF_TRUSTED_ORIGINS', [])
        assert isinstance(trusted, list)
        assert len(trusted) > 0


# ---------------------------------------------------------------------------
# Authentication integration tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestLoginEndpoint:
    """Integration tests for /auth/login/ (DRF session/token auth)."""

    def test_login_valid_credentials_returns_200(self):
        user = UserFactory()
        client = APIClient()
        response = client.post(
            '/auth/login/',
            {'username': user.username, 'password': 'password'},
            format='json',
        )
        assert response.status_code == 200

    def test_login_returns_token(self):
        user = UserFactory()
        client = APIClient()
        response = client.post(
            '/auth/login/',
            {'username': user.username, 'password': 'password'},
            format='json',
        )
        assert response.status_code == 200
        data = response.json()
        assert 'token' in data, 'Login response must contain token'
        assert data['token']

    def test_login_wrong_password_returns_400(self):
        user = UserFactory()
        client = APIClient()
        response = client.post(
            '/auth/login/',
            {'username': user.username, 'password': 'WRONG_PASSWORD'},
            format='json',
        )
        assert response.status_code in (400, 401)

    def test_login_unknown_user_returns_400(self):
        client = APIClient()
        response = client.post(
            '/auth/login/',
            {'username': 'nonexistent_user_xyz', 'password': 'whatever'},
            format='json',
        )
        assert response.status_code in (400, 401)

    def test_login_empty_credentials_returns_400(self):
        client = APIClient()
        response = client.post('/auth/login/', {}, format='json')
        assert response.status_code == 400

    def test_login_missing_password_returns_400(self):
        user = UserFactory()
        client = APIClient()
        response = client.post('/auth/login/', {'username': user.username}, format='json')
        assert response.status_code == 400

    def test_login_missing_username_returns_400(self):
        client = APIClient()
        response = client.post('/auth/login/', {'password': 'pass'}, format='json')
        assert response.status_code == 400

    @override_settings(
        CORS_ALLOWED_ORIGINS=['http://127.0.0.1:3000', 'http://127.0.0.1:8080'],
        CORS_ALLOW_ALL_ORIGINS=False,
        CORS_ALLOW_CREDENTIALS=True,
    )
    def test_login_preflight_from_frontend_origin_allowed(self):
        """OPTIONS preflight to /auth/login/ from the dev frontend origin must succeed."""
        client = APIClient()
        for origin in ['http://127.0.0.1:3000', 'http://127.0.0.1:8080']:
            response = client.options(
                '/auth/login/',
                HTTP_ORIGIN=origin,
                HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
                HTTP_ACCESS_CONTROL_REQUEST_HEADERS='Content-Type',
            )
            assert response.get('Access-Control-Allow-Origin') == origin, (
                f'Preflight from {origin} must receive matching ACAO header'
            )

    @override_settings(
        CORS_ALLOWED_ORIGINS=['http://127.0.0.1:3000', 'http://127.0.0.1:8080'],
        CORS_ALLOW_ALL_ORIGINS=False,
    )
    def test_login_preflight_from_unknown_origin_rejected(self):
        """OPTIONS preflight from an unknown origin must not receive ACAO header."""
        client = APIClient()
        response = client.options(
            '/auth/login/',
            HTTP_ORIGIN='http://attacker.example.com',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
        )
        assert response.get('Access-Control-Allow-Origin') is None


# ---------------------------------------------------------------------------
# Authentication / protected endpoint tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAuthProtectedEndpoints:
    """Verify that protected endpoints require authentication."""

    PROTECTED_ENDPOINTS = [
        '/api/v2/projects/',
        '/api/v2/users/',
    ]

    def test_unauthenticated_request_returns_401(self):
        client = APIClient()
        for endpoint in self.PROTECTED_ENDPOINTS:
            response = client.get(endpoint)
            assert response.status_code == 401, (
                f'{endpoint} should return 401 for unauthenticated request'
            )

    def test_authenticated_request_returns_200_or_403(self):
        user = UserFactory()
        client = APIClient()
        client.force_authenticate(user=user)
        for endpoint in self.PROTECTED_ENDPOINTS:
            response = client.get(endpoint)
            assert response.status_code in (200, 403), (
                f'{endpoint} should return 200 or 403 for authenticated user (not 401)'
            )

    def test_token_auth_grants_access(self):
        """A token obtained from /auth/login/ must authenticate subsequent requests."""
        user = UserFactory()
        client = APIClient()
        login_resp = client.post(
            '/auth/login/',
            {'username': user.username, 'password': 'password'},
            format='json',
        )
        assert login_resp.status_code == 200
        token = login_resp.json()['token']

        authed_client = APIClient()
        authed_client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        response = authed_client.get('/api/v2/projects/')
        assert response.status_code in (200, 403), (
            'Token-authenticated request should not return 401'
        )

    def test_invalid_token_returns_401(self):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION='Token invalidtoken000000000000')
        response = client.get('/api/v2/projects/')
        assert response.status_code == 401

    def test_logout_invalidates_token(self):
        """After logout, the token must no longer authenticate."""
        user = UserFactory()
        client = APIClient()
        login_resp = client.post(
            '/auth/login/',
            {'username': user.username, 'password': 'password'},
            format='json',
        )
        assert login_resp.status_code == 200
        token = login_resp.json()['token']

        logout_client = APIClient()
        logout_client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        logout_resp = logout_client.post('/auth/logout/')
        assert logout_resp.status_code in (200, 204)

        reuse_client = APIClient()
        reuse_client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        reuse_resp = reuse_client.get('/api/v2/projects/')
        assert reuse_resp.status_code == 401, (
            'Token must be invalidated after logout'
        )


# ---------------------------------------------------------------------------
# CORS + auth combined test
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestCORSWithAuth:
    """Test that CORS headers are returned alongside auth responses."""

    @override_settings(
        CORS_ALLOWED_ORIGINS=['http://127.0.0.1:3000'],
        CORS_ALLOW_CREDENTIALS=True,
        CORS_ALLOW_ALL_ORIGINS=False,
    )
    def test_failed_login_from_allowed_origin_has_cors_headers(self):
        """Even a 400 login failure must include CORS headers so the browser can read the error."""
        client = APIClient()
        response = client.post(
            '/auth/login/',
            {'username': 'bad', 'password': 'bad'},
            format='json',
            HTTP_ORIGIN='http://127.0.0.1:3000',
        )
        assert response.get('Access-Control-Allow-Origin') == 'http://127.0.0.1:3000', (
            'CORS headers must be present even on error responses'
        )

    @override_settings(
        CORS_ALLOWED_ORIGINS=['http://127.0.0.1:3000'],
        CORS_ALLOW_CREDENTIALS=True,
        CORS_ALLOW_ALL_ORIGINS=False,
    )
    def test_successful_login_from_allowed_origin_has_cors_headers(self):
        """Successful login must include CORS headers."""
        user = UserFactory()
        client = APIClient()
        response = client.post(
            '/auth/login/',
            {'username': user.username, 'password': 'password'},
            format='json',
            HTTP_ORIGIN='http://127.0.0.1:3000',
        )
        assert response.status_code == 200
        assert response.get('Access-Control-Allow-Origin') == 'http://127.0.0.1:3000'

    @override_settings(
        CORS_ALLOWED_ORIGINS=['http://127.0.0.1:3000'],
        CORS_ALLOW_CREDENTIALS=True,
        CORS_ALLOW_ALL_ORIGINS=False,
    )
    def test_protected_endpoint_from_allowed_origin_has_cors_headers(self):
        """401 response to unauthenticated request from allowed origin must have CORS headers."""
        client = APIClient()
        response = client.get(
            '/api/v2/projects/',
            HTTP_ORIGIN='http://127.0.0.1:3000',
        )
        assert response.status_code == 401
        assert response.get('Access-Control-Allow-Origin') == 'http://127.0.0.1:3000', (
            'CORS headers must be set on 401 responses too'
        )
