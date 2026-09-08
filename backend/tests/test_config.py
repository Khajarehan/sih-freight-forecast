import pytest
from app.core.config import get_settings


def test_settings_load_without_a_live_database(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    monkeypatch.delenv("BACKEND_CORS_ORIGINS", raising=False)
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.database_url.startswith("postgresql+psycopg://")
    assert settings.timescale_enabled is False
    assert "http://localhost:3000" in settings.cors_origin_list

