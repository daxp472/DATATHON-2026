from fastapi import APIRouter
from datetime import datetime
import os

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    return {
        "service": "AI / ML Anomaly Detection Service",
        "status": "HEALTHY",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "model": "IsolationForest-v1.2.0",
        "engine": "scikit-learn + FastAPI",
        "version": "1.0.0"
    }
