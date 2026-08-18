import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_short_content_is_rejected():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/analyze", json={"content": "short", "task": "summary"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_invalid_task_is_rejected():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/analyze", json={"content": "x" * 100, "task": "rag"})
    assert response.status_code == 422

