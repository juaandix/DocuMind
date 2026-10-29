import pytest

import app.database as database
import app.redis_client as redis_client
from app.workers.celery_app import run_async


async def _touch_clients():
    # Creating the clients binds them to the running loop; no server is needed.
    return id(database.get_client()), id(redis_client.get_redis())


def test_each_task_gets_fresh_clients_and_leaves_none_behind():
    first = run_async(_touch_clients())
    assert database._client is None
    assert redis_client._redis is None

    # A second task in a new event loop must not reuse clients bound to the closed one.
    second = run_async(_touch_clients())
    assert database._client is None
    assert redis_client._redis is None
    assert first != second


def test_clients_are_closed_even_when_the_task_fails():
    async def _boom():
        database.get_client()
        redis_client.get_redis()
        raise ValueError("task failed")

    with pytest.raises(ValueError):
        run_async(_boom())
    assert database._client is None
    assert redis_client._redis is None
