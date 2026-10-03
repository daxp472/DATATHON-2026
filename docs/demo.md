# Demo Guide & Live Demonstration Script

## One-Line Pitch
> **"We built a real-time AI decision engine that analyzes transactions as they happen, detects abnormal behavior, explains the risk, and recommends an immediate action before a potential loss occurs."**

---

## Complete Decision Loop Demonstration

```
EVENT → INTELLIGENCE → RISK → EXPLANATION → DECISION → ACTION
```

### Scenario 1: Normal Transaction (Expected: ALLOW)
- **Customer Average**: INR 2,400.00
- **Transaction Amount**: INR 2,450.00
- **Time**: 14:30 PM
- **Device / Location**: Known customer device, primary city
- **AI Risk Score**: 15 / 100 (LOW)
- **Decision Engine Action**: **`ALLOW`** (Auto-Approve)
- **Explanation**: Behavioral patterns conform to baseline.

---

### Scenario 2: Suspicious Step-Up Transaction (Expected: REVIEW)
- **Customer Average**: INR 2,400.00
- **Transaction Amount**: INR 9,500.00 (3.9x average)
- **Device**: New mobile browser
- **AI Risk Score**: 58 / 100 (MEDIUM)
- **Decision Engine Action**: **`REVIEW`** (Trigger MFA / Hold)
- **Explanation**: Elevated amount and unrecognized device identifier.

---

### Scenario 3: High-Risk Outlier Attack (Expected: BLOCK)
- **Customer Average**: INR 2,400.00
- **Transaction Amount**: INR 87,500.00 (36.5x average)
- **Time**: 03:17 AM (Off-peak anomaly)
- **Device / Location**: New device, unfamiliar geographic cluster
- **Failed Attempts**: 2 recent failures in past 60 minutes
- **Velocity**: 4 transactions in past hour
- **AI Risk Score**: 91–100 / 100 (HIGH)
- **Decision Engine Action**: **`BLOCK`** (Immediate Prevent)
- **Explanation**: Compound anomaly with severe amount deviation, off-peak timing, failed authentications, and new device.
- **Alert**: Instant live alert generated on Command Center.

---

## Simulation Data Notice
All demo transactions are explicitly tagged with `DEMO / SIMULATION DATA` in database records, API payloads, and UI badges.
