from app.core.config import get_settings


def test_settings_load_without_a_live_database() -> None:
    settings = get_settings()

    assert settings.database_url.startswith("postgresql+psycopg://")
    assert settings.timescale_enabled is False
    assert settings.cors_origin_list == ["http://localhost:3000"]
