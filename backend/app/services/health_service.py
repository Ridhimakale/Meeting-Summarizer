from app.core.config import settings
from app.database.session import engine
from app.schemas.health import HealthResponse
from sqlalchemy import text


class HealthService:
    def get_status(self) -> HealthResponse:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return HealthResponse(
            status="ok",
            app=settings.app_name,
            database="connected",
        )
