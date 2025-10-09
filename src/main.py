from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import users, statements, payments, ai
from src.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(statements.router, prefix="/api/statements", tags=["statements"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)