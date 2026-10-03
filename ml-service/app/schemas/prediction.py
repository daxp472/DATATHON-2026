from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class TransactionFeatures(BaseModel):
    transactionId: Optional[str] = "TXN-DEMO-001"
    customerId: str = "CUST-1001"
    amount: float = Field(..., description="Transaction amount in currency units")
    normalCustomerAvg: float = Field(default=2500.0, description="Customer historical average amount")
    customerStdDev: Optional[float] = Field(default=1000.0, description="Customer amount standard deviation")
    transactionTime: Optional[str] = Field(default=None, description="ISO timestamp or HH:MM string")
    hourOfDay: Optional[int] = Field(default=12, ge=0, le=23, description="Hour of the transaction (0-23)")
    isNewDevice: bool = Field(default=False, description="Flag indicating if device is new/unrecognized")
    isUnusualLocation: bool = Field(default=False, description="Flag indicating if geolocation differs from customer profile")
    deviceType: Optional[str] = Field(default="Mobile App", description="Device type or user-agent")
    location: Optional[str] = Field(default="Domestic", description="City / Region / Country")
    recentFailedAttempts: int = Field(default=0, ge=0, description="Number of failed attempts in last 1 hour")
    recentSuspiciousAttempts: int = Field(default=0, ge=0, description="Number of suspicious events in last 24 hours")
    transactionVelocity1h: int = Field(default=1, ge=0, description="Number of transactions initiated by customer in last 1 hour")
    channel: Optional[str] = Field(default="ONLINE_BANKING", description="Transaction channel e.g., POS, ONLINE, ATM, Z_OS_CORE")
    sourceSystem: Optional[str] = Field(default="WEB_GATEWAY", description="Ingestion source (e.g., IBM_Z_CICS, DIRECT_API, SIMULATION)")
    metadata: Optional[Dict[str, Any]] = None

class RiskExplanation(BaseModel):
    feature: str
    impact: str # HIGH, MEDIUM, LOW
    description: str

class RiskPredictionResponse(BaseModel):
    risk_score: int = Field(..., ge=0, le=100, description="Risk Score normalized to 0-100")
    anomaly_score: float = Field(..., description="Raw ML Anomaly / Outlier decision score")
    risk_level: str = Field(..., description="LOW, MEDIUM, or HIGH")
    reasons: List[str] = Field(..., description="Human-understandable risk explanations")
    factor_breakdown: List[RiskExplanation] = Field(default_factory=list)
    model_version: str = "IsolationForest-v1.2.0"
    is_anomaly: bool
    execution_time_ms: float
