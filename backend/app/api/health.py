from app.schemas.health import HealthResponse
from app.services.health_service import HealthService
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/health", tags=["health"])


def get_health_service() -> HealthService:
    return HealthService()


@router.get("", response_model=HealthResponse)
def health_check(service: HealthService = Depends(get_health_service)) -> HealthResponse:
    return service.get_status()
