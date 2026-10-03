from fastapi import APIRouter, HTTPException, status
from app.schemas.prediction import TransactionFeatures, RiskPredictionResponse
from app.services.risk_engine import risk_engine

router = APIRouter(tags=["Inference"])

@router.post("/predict", response_model=RiskPredictionResponse, status_code=status.HTTP_200_OK)
async def predict_risk(features: TransactionFeatures):
    """
    Real-time AI Inference Endpoint:
    Receives engineered transaction features, computes anomaly score & risk score (0-100),
    and generates contextual human-readable risk explanations.
    """
    try:
        result = risk_engine.analyze(features)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference execution failed: {str(e)}"
        )
