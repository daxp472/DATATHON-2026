# Local Testing & Transaction Simulation Guide

> **Important Safety Notice:**
> The Real-Time AI Fraud & Risk Decision Engine operates strictly in **DEMO / SIMULATION MODE**. There is no connection to live banking or production payment networks. All generated transactions are synthetic, deterministic test artifacts labeled `DEMO / SIMULATION DATA`.

---

## 1. Complete Synthetic Data Flow

When any simulation scenario or custom transaction is triggered, it **never bypasses the system**. It flows through the identical real-time decision pipeline:

```
Test Scenario / Custom Generator / IBM Z Adapter
                       │
                       ▼
    Node.js Ingestion Gateway (`POST /api/transactions`)
                       │
                       ▼
    Validation Middleware (`validateTransaction.js`)
                       │
                       ▼
    Feature Extractor (`featureExtractor.js`)
    (MongoDB Customer Profile & 1h Velocity Lookup)
                       │
                       ▼
    Python ML Service (`POST /predict` on Port 8000)
    (Isolation Forest Anomaly & Statistical Scoring)
                       │
                       ▼
    Decision Engine (`decisionEngine.js`)
    (ALLOW <= 35 | 36-75 REVIEW | BLOCK >= 76)
                       │
                       ▼
    MongoDB Document Persistence (`transactions`, `alerts`, `ibm_z_events`)
                       │
                       ▼
    Socket.io Broadcast (`transaction:new`, `alert:new`, `dashboard:stats`)
                       │
                       ▼
    React Live Command Center & Simulation View
```

---

## 2. Predefined Anomaly & Attack Scenarios

| # | Scenario Name | Trigger Endpoint | Observed Characteristics | Expected Risk | Decision |
|---|---|---|---|---|---|
| **1** | **Normal Transaction** | `POST /api/simulation/scenario/normal` | Amount ~ ₹2,400, known device, primary location, normal daytime. | **LOW (0-35)** | **`ALLOW`** |
| **2** | **High Amount Spike** | `POST /api/simulation/scenario/high-amount` | Amount 22x above baseline (₹52,800+), known device. | **ELEVATED (55-80)** | **`REVIEW / BLOCK`** |
| **3** | **New Device Novelty** | `POST /api/simulation/scenario/new-device` | Unrecognized device fingerprint and user-agent. | **MEDIUM (40-65)** | **`REVIEW`** |
| **4** | **Unusual Location** | `POST /api/simulation/scenario/unusual-location` | Foreign IP cluster (Bucharest, Romania). | **MEDIUM / HIGH** | **`REVIEW / BLOCK`** |
| **5** | **Unusual Time** | `POST /api/simulation/scenario/unusual-time` | Initiated at 03:17 AM off-peak window. | **ELEVATED (45-65)** | **`REVIEW`** |
| **6** | **High Velocity Burst** | `POST /api/simulation/scenario/high-velocity` | 8 transactions in rolling 1-hour window. | **HIGH (65-85)** | **`REVIEW / BLOCK`** |
| **7** | **Failed Attempts** | `POST /api/simulation/scenario/failed-attempts` | 3 consecutive prior authentication failures. | **HIGH (70-90)** | **`REVIEW / BLOCK`** |
| **8** | **Behavioral Drift** | `POST /api/simulation/scenario/behavior-change` | Baseline ₹2,400 jumps to ₹72,000 with new device & location. | **HIGH (80-95)** | **`BLOCK`** |
| **9** | **Multi-Signal Attack** | `POST /api/simulation/scenario/multi-signal` | ₹87,500 + New Device + Unusual Loc + 03:17 AM + Velocity 6 + Failures. | **CRITICAL (90-100)** | **`BLOCK`** |

---

## 3. IBM Z / z/OS Enterprise Scenarios

| Scenario Key | Channel | Payload Characteristics | Expected Outcome |
|---|---|---|---|
| **`normal`** | `IBM_Z_CWIR` | Wire transfer ₹45,000 (Baseline ₹500,000) via IBM-Z16 Gateway | **ALLOW** (Risk Score 28) |
| **`anomaly`** | `IBM_Z_CSET` | Settlement wire ₹4,800,000 (9.6x baseline) via Frankfurt bridge | **REVIEW / BLOCK** |
| **`attack`** | `IBM_Z_CADM` | Unmapped TN3270 emulator + 03:00 AM + 4 RACF violations | **BLOCK** (Risk Score 100) |

---

## 4. Running the Automated Test Suite

The system includes a 22-step automated integration test suite testing all endpoints, error handling, machine learning, and idempotency:

```powershell
cd backend
npm test
```

### Test Suite Output:
```
====================================================
🧪 REAL-TIME AI FRAUD & RISK ENGINE — TEST SUITE
Target Gateway: http://127.0.0.1:5000
====================================================

• Running: Composite Health Check (Backend, DB, Python ML) ... PASSED
• Running: Validation Middleware Rejects Malformed Transaction ... PASSED
• Running: Scenario 1: Normal Transaction -> ALLOW ... PASSED
• Running: Scenario 2: High Amount Deviation -> Detected Signal ... PASSED
• Running: Scenario 3: New Device -> Device Novelty Factor ... PASSED
• Running: Scenario 4: Unusual Location -> Location Anomaly Factor ... PASSED
• Running: Scenario 5: Unusual Time (03:17 AM) -> Temporal Anomaly Factor ... PASSED
• Running: Scenario 6: High Velocity (8 tx/hr) -> Velocity Anomaly Factor ... PASSED
• Running: Scenario 7: Prior Failed Attempts -> Failure Factor ... PASSED
• Running: Scenario 8: Sudden Behavior Change -> Compound Signals ... PASSED
• Running: Scenario 9: Multi-Signal Attack -> BLOCK (Score 90-100) ... PASSED
• Running: Batch Simulation Runner (5 mixed events sequentially) ... PASSED
• Running: Customer Profile & Transaction History Query ... PASSED
• Running: IBM Z Status Endpoint (Demonstration Mode Verified) ... PASSED
• Running: IBM Z Normal CICS Event -> Ingestion & ALLOW ... PASSED
• Running: IBM Z Settlement Anomaly -> Elevated Risk & REVIEW/BLOCK ... PASSED
• Running: IBM Z Mainframe Attack -> Score 90-100 & BLOCK ... PASSED
• Running: IBM Z Event Ingestion & Idempotent Deduplication ... PASSED
• Running: IBM Z Event Audit Trail Query (MongoDB ibm_z_events) ... PASSED
• Running: 1-Click 5-Stage Datathon Full Demo Sequence Execution ... PASSED
• Running: Transaction Export (CSV Format) ... PASSED
• Running: Transaction Export (JSON Format) ... PASSED

====================================================
📊 TEST SUITE SUMMARY: 22 Passed, 0 Failed
====================================================
```
