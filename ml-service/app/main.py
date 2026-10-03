from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.health import router as health_router
from app.api.predict import router as predict_router

app = FastAPI(
    title="Real-Time AI Fraud & Risk Decision ML Service",
    description="Python FastAPI service providing Isolation Forest anomaly detection, 0-100 risk scoring, and explainable AI factors.",
    version="1.0.0"
)

# Enable CORS for internal services and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(predict_router)

@app.get("/")
async def root():
    return {
        "message": "Real-Time AI Fraud & Risk ML Engine is operational",
        "docs_url": "/docs",
        "health_check": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
