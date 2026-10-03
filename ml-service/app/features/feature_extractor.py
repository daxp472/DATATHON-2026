import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from app.schemas.prediction import TransactionFeatures

class FeatureExtractor:
    """
    Transforms transaction inputs and behavioral context into structured feature vectors.
    """
    def __init__(self):
        self.feature_names = [
            "amount_ratio",
            "z_score_amount",
            "is_unusual_time",
            "is_new_device",
            "is_unusual_location",
            "velocity_score",
            "failed_attempts_score",
            "suspicious_attempts_score",
            "combined_risk_indicators"
        ]

    def extract(self, data: TransactionFeatures) -> Tuple[np.ndarray, Dict[str, Any]]:
        # 1. Amount ratio relative to customer historical average
        safe_avg = max(data.normalCustomerAvg, 1.0)
        amount_ratio = data.amount / safe_avg

        # 2. Z-score approximation
        std_dev = max(data.customerStdDev or (safe_avg * 0.4), 10.0)
        z_score_amount = max(0.0, (data.amount - safe_avg) / std_dev)

        # 3. Unusual transaction time (e.g. 1:00 AM - 5:00 AM local time is higher risk)
        hour = data.hourOfDay
        is_unusual_time = 1.0 if (1 <= hour <= 5) else 0.0

        # 4. Device and Geolocation binary flags
        is_new_dev = 1.0 if data.isNewDevice else 0.0
        is_unusual_loc = 1.0 if data.isUnusualLocation else 0.0

        # 5. Velocity and prior failure signals
        velocity_score = min(float(data.transactionVelocity1h), 10.0)
        failed_attempts_score = min(float(data.recentFailedAttempts), 10.0)
        suspicious_attempts_score = min(float(data.recentSuspiciousAttempts), 5.0)

        # 6. Combined weak signals count
        weak_signals = (
            (1 if amount_ratio > 2.5 else 0) +
            (1 if is_unusual_time else 0) +
            (1 if is_new_dev else 0) +
            (1 if is_unusual_loc else 0) +
            (1 if data.recentFailedAttempts > 0 else 0) +
            (1 if data.transactionVelocity1h > 3 else 0)
        )

        vector = np.array([
            amount_ratio,
            z_score_amount,
            is_unusual_time,
            is_new_dev,
            is_unusual_loc,
            velocity_score,
            failed_attempts_score,
            suspicious_attempts_score,
            float(weak_signals)
        ], dtype=np.float32).reshape(1, -1)

        diagnostics = {
            "amount_ratio": round(amount_ratio, 2),
            "z_score_amount": round(z_score_amount, 2),
            "is_unusual_time": bool(is_unusual_time),
            "is_new_device": bool(is_new_dev),
            "is_unusual_location": bool(is_unusual_loc),
            "weak_signals_count": weak_signals,
            "velocity": data.transactionVelocity1h,
            "failed_attempts": data.recentFailedAttempts
        }

        return vector, diagnostics

feature_extractor = FeatureExtractor()
