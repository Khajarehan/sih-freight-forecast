from fastapi import APIRouter

from app.api.routes import baltic, forecasts, health, optimization, ports, routes

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(ports.router)
api_router.include_router(routes.router)
api_router.include_router(baltic.router)
api_router.include_router(forecasts.router)
api_router.include_router(optimization.router)

