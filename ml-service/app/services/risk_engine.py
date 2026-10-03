import time
from typing import List, Tuple
from app.schemas.prediction import TransactionFeatures, RiskPredictionResponse, RiskExplanation
from app.features.feature_extractor import feature_extractor
from app.models.anomaly_detector import anomaly_detector

class RiskEngine:
    """
    Orchestrates Feature Extraction, ML Anomaly Inference, 
    Deterministic 0-100 Risk Scoring, and Transparent Explanation Generation.
    """
    def __init__(self):
        self.extractor = feature_extractor
        self.model = anomaly_detector

    def analyze(self, data: TransactionFeatures) -> RiskPredictionResponse:
        start_time = time.perf_counter()

        # 1. Feature Extraction
        feature_vec, diag = self.extractor.extract(data)

        # 2. ML Anomaly Score (0.0 to 1.0)
        ml_anomaly_prob = self.model.score(feature_vec)

        # 3. Behavioral Risk Composite Calculation (0 - 100)
        risk_score, reasons, factor_breakdown = self._calculate_risk_and_explanations(data, diag, ml_anomaly_prob)

        # 4. Assign Risk Level
        if risk_score >= 76:
            risk_level = "HIGH"
        elif risk_score >= 36:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        exec_time = (time.perf_counter() - start_time) * 1000.0

        return RiskPredictionResponse(
            risk_score=risk_score,
            anomaly_score=round(ml_anomaly_prob, 4),
            risk_level=risk_level,
            reasons=reasons,
            factor_breakdown=factor_breakdown,
            model_version=self.model.model_version,
            is_anomaly=bool(risk_score >= 70 or ml_anomaly_prob > 0.65),
            execution_time_ms=round(exec_time, 2)
        )

    def _calculate_risk_and_explanations(
        self, data: TransactionFeatures, diag: dict, ml_prob: float
    ) -> Tuple[int, List[str], List[RiskExplanation]]:
        reasons = []
        breakdown = []
        base_score = ml_prob * 60.0 # 60% weight from ML Anomaly Model

        # Contextual feature assessments
        amount_ratio = diag["amount_ratio"]
        if amount_ratio >= 10.0:
            base_score += 25.0
            reasons.append(f"Transaction amount (INR {data.amount:,.2f}) is significantly higher ({amount_ratio:.1f}x) than customer average (INR {data.normalCustomerAvg:,.2f}).")
            breakdown.append(RiskExplanation(feature="AMOUNT_DEVIATION", impact="HIGH", description=f"{amount_ratio:.1f}x above baseline"))
        elif amount_ratio >= 3.0:
            base_score += 15.0
            reasons.append(f"Transaction amount (INR {data.amount:,.2f}) is noticeably elevated ({amount_ratio:.1f}x) above average.")
            breakdown.append(RiskExplanation(feature="AMOUNT_DEVIATION", impact="MEDIUM", description=f"{amount_ratio:.1f}x normal average"))
        
        if data.isNewDevice:
            base_score += 15.0
            reasons.append("Device has not previously been associated with this customer profile.")
            breakdown.append(RiskExplanation(feature="NEW_DEVICE", impact="MEDIUM", description="Unrecognized device identifier / user-agent"))

        if data.isUnusualLocation:
            base_score += 15.0
            reasons.append(f"Transaction location ({data.location or 'Unknown'}) differs from historical customer geographic cluster.")
            breakdown.append(RiskExplanation(feature="LOCATION_ANOMALY", impact="MEDIUM", description="Geographic deviation from primary usage area"))

        if diag["is_unusual_time"]:
            base_score += 10.0
            reasons.append(f"Transaction initiated at an unusual hour ({data.hourOfDay:02d}:00), outside typical user active window.")
            breakdown.append(RiskExplanation(feature="TEMPORAL_ANOMALY", impact="LOW", description=f"Off-peak activity window ({data.hourOfDay:02d}:00 hrs)"))

        if data.recentFailedAttempts > 0:
            penalty = min(20.0, data.recentFailedAttempts * 8.0)
            base_score += penalty
            reasons.append(f"{data.recentFailedAttempts} recent failed attempt(s) detected in the last hour prior to this transaction.")
            breakdown.append(RiskExplanation(feature="PRIOR_FAILURES", impact="HIGH" if data.recentFailedAttempts >= 3 else "MEDIUM", description=f"{data.recentFailedAttempts} failed auth events"))

        if data.transactionVelocity1h >= 4:
            base_score += 12.0
            reasons.append(f"High transaction velocity: {data.transactionVelocity1h} transactions initiated within 1 hour.")
            breakdown.append(RiskExplanation(feature="TRANSACTION_VELOCITY", impact="MEDIUM", description=f"Velocity spike: {data.transactionVelocity1h} tx/hr"))

        if diag["weak_signals_count"] >= 3:
            base_score += 8.0
            reasons.append(f"Compound Risk: Combination of {diag['weak_signals_count']} correlated weak signals detected.")
            breakdown.append(RiskExplanation(feature="COMPOUND_SIGNALS", impact="HIGH", description=f"{diag['weak_signals_count']} simultaneous anomalies"))

        # If perfectly normal
        if not reasons:
            reasons.append("Transaction amount, device, location, and timing conform to established behavioral baseline.")
            breakdown.append(RiskExplanation(feature="NORMAL_BASELINE", impact="LOW", description="Matches customer historical parameters"))

        final_score = int(round(max(0.0, min(100.0, base_score))))
        return final_score, reasons, breakdown

risk_engine = RiskEngine()
