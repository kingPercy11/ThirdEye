from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from middleware.cors_middleware import get_cors_config
from routes import analysis_routes, data_routes, health_routes

app = FastAPI()

# Add CORS middleware
app.add_middleware(CORSMiddleware, **get_cors_config())

# Include all routes
app.include_router(health_routes.router)
app.include_router(analysis_routes.router)
app.include_router(data_routes.router)
