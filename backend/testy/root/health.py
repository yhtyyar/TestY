import logging

from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse

logger = logging.getLogger('testy')


def liveness(request):
    """Liveness probe — checks that the process is alive."""
    return JsonResponse({'status': 'ok'})


def readiness(request):
    """Readiness probe — checks that all dependencies are available."""
    checks = {}

    try:
        connection.ensure_connection()
        checks['database'] = 'ok'
    except Exception as exc:
        logger.error('Readiness check failed: database — %s', exc)
        checks['database'] = str(exc)

    try:
        cache.set('_health_check', 'ok', 5)
        cached = cache.get('_health_check')
        if cached != 'ok':
            raise ValueError('Cache read-back mismatch')
        checks['cache'] = 'ok'
    except Exception as exc:
        logger.error('Readiness check failed: cache — %s', exc)
        checks['cache'] = str(exc)

    all_ok = all(v == 'ok' for v in checks.values())
    status_code = 200 if all_ok else 503
    return JsonResponse(
        {'status': 'ok' if all_ok else 'degraded', 'checks': checks},
        status=status_code,
    )
