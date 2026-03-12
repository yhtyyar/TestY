import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestHealthCheckEndpoints:

    def setup_method(self):
        self.client = APIClient()

    def test_legacy_healthcheck_returns_200(self):
        response = self.client.get('/healthcheck/')
        assert response.status_code == 200
        assert response.json()['status'] == 'ok'

    def test_liveness_returns_200(self):
        response = self.client.get('/healthz/')
        assert response.status_code == 200
        assert response.json()['status'] == 'ok'

    def test_readiness_returns_200(self):
        response = self.client.get('/readyz/')
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'ok'
        assert 'checks' in data

    def test_readiness_checks_database(self):
        response = self.client.get('/readyz/')
        data = response.json()
        assert data['checks']['database'] == 'ok'

    def test_readiness_checks_cache(self):
        response = self.client.get('/readyz/')
        data = response.json()
        assert data['checks']['cache'] == 'ok'

    def test_health_check_no_auth_required(self):
        for url in ['/healthcheck/', '/healthz/', '/readyz/']:
            response = self.client.get(url)
            assert response.status_code == 200, f'{url} should not require auth'
