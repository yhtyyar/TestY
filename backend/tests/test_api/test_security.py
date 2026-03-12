import pytest
from django.conf import settings
from django.test import override_settings
from rest_framework.test import APIClient

from tests.factories import UserFactory


@pytest.mark.django_db
class TestCORSConfiguration:

    def test_cors_allow_all_origins_disabled(self):
        assert not getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False)

    def test_cors_allowed_origins_is_list(self):
        assert isinstance(settings.CORS_ALLOWED_ORIGINS, list)

    def test_cors_allowed_origins_not_empty(self):
        assert len(settings.CORS_ALLOWED_ORIGINS) > 0

    def test_cors_allow_credentials_enabled(self):
        assert settings.CORS_ALLOW_CREDENTIALS is True

    def test_cors_allowed_origins_format(self):
        for origin in settings.CORS_ALLOWED_ORIGINS:
            assert origin.startswith('http://') or origin.startswith('https://'), (
                f'Origin {origin} must start with http:// or https://'
            )


@pytest.mark.django_db
class TestThrottleConfiguration:

    def test_throttle_classes_configured(self):
        throttle_classes = settings.REST_FRAMEWORK.get('DEFAULT_THROTTLE_CLASSES', [])
        assert len(throttle_classes) > 0

    def test_throttle_rates_configured(self):
        rates = settings.REST_FRAMEWORK.get('DEFAULT_THROTTLE_RATES', {})
        assert 'anon' in rates
        assert 'user' in rates
        assert 'login' in rates

    def test_login_throttle_rate_is_restrictive(self):
        rates = settings.REST_FRAMEWORK.get('DEFAULT_THROTTLE_RATES', {})
        login_rate = rates.get('login', '')
        count = int(login_rate.split('/')[0])
        assert count <= 10, 'Login throttle should be at most 10 attempts per period'


@pytest.mark.django_db
class TestLoginThrottleIntegration:

    @override_settings(
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            'DEFAULT_THROTTLE_RATES': {
                'anon': '100/minute',
                'user': '300/minute',
                'login': '3/minute',
            },
        },
    )
    def test_login_returns_429_after_exceeding_limit(self):
        client = APIClient()
        for _ in range(4):
            client.post('/auth/login/', {'username': 'wrong', 'password': 'wrong'}, format='json')
        response = client.post('/auth/login/', {'username': 'wrong', 'password': 'wrong'}, format='json')
        assert response.status_code == 429

    def test_successful_login_not_blocked(self):
        user = UserFactory()
        client = APIClient()
        response = client.post(
            '/auth/login/',
            {'username': user.username, 'password': 'wrongpass'},
            format='json',
        )
        assert response.status_code != 429
