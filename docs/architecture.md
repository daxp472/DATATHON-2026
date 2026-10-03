# System Architecture Specification

> **Project:** Real-Time AI Fraud & Risk Decision Engine  
> **Theme:** Real-Time AI for Critical Decisions  
> **Datathon Edition:** Datathon 2026  

---

## 1. High-Level System Architecture

The Real-Time AI Fraud & Risk Decision Engine is built as an event-driven, microservices-based, sub-second decision-support system:

```
                            TRANSACTION SOURCES
   ┌───────────────────────────────┐     ┌───────────────────────────────┐
   │ Synthetic Testing / Simulator │     │ IBM Z / z/OS Mainframe Stream │
   │   (REST Ingestion Client)     │     │  (CICS/IMS Enterprise Adapter)│
   └───────────────┬───────────────┘     └───────────────┬───────────────┘
                   │                                     │
                   │               ┌─────────────────────┘
                   ▼               ▼
          ┌─────────────────────────────────────────────────┐
          │     Node.js + Express API Gateway (Port 5000)   │
          │  • Joi Schema Validation & Security Sanitizer   │
          │  • Dual-Tier Idempotency Manager (Memory + DB)  │
          │  • Customer Behavioral Baseline Lookup          │
          │  • Dynamic Feature Engineering & Aggregation    │
          └────────────────────────┬────────────────────────┘
                                   │ HTTP (Payload < 2KB)
                                   ▼
          ┌─────────────────────────────────────────────────┐
          │      Python FastAPI ML Service (Port 8000)      │
          │  • Vectorized Isolation Forest Ensemble (T=100) │
          │  • Multi-Variate Mahalanobis Distance Metric    │
          │  • Composite 0–100 Risk Score Calibration       │
          │  • Explainable AI (XAI) Factor Extraction       │
          └────────────────────────┬────────────────────────┘
                                   │ Prediction Response (< 1ms)
                                   ▼
          ┌─────────────────────────────────────────────────┐
          │      Deterministic Decision Engine (Backend)    │
          │  • ALLOW (Score <= 35) -> Auto Authorize        │
          │  • REVIEW (36 <= Score <= 75) -> Step-Up / MFA  │
          │  • BLOCK (Score >= 76) -> Prevent & Escalate    │
          └───────────────┬─────────────────┬───────────────┘
                          │                 │
            Persist Event │                 │ Real-Time Broadcast
                          ▼                 ▼
          ┌────────────────────────┐   ┌────────────────────────┐
          │    MongoDB Database    │   │  Socket.io WebSocket   │
          │  (Port 27017, Native)  │   │     (Sub-Second Push)  │
          │  • transactions        │   └───────────┬────────────┘
          │  • customers           │               │
          │  • alerts              │               ▼
          │  • ibm_z_events        │   ┌────────────────────────┐
          └────────────────────────┘   │  React + Vite FrontEnd │
                                       │ (Port 5173, Dashboard) │
                                       └────────────────────────┘
```

---

## 2. End-to-End Decision Lifecycle

1. **Event Ingestion**: A financial transaction is received via `POST /api/transactions` or `POST /api/integrations/ibm-z/event`.
2. **Idempotency Verification**: The dual-tier idempotency manager checks whether `eventId` or `transactionId` has been processed within the rolling cache window.
3. **Behavioral Enrichment**: The customer baseline profile (historical mean amount, standard deviation, known device IDs, typical location clusters) is pulled from MongoDB.
4. **Feature Extraction**: Features are derived in memory:
   - `amount_to_mean_ratio = amount / normalCustomerAvg`
   - `amount_zscore = (amount - mu) / sigma`
   - `device_novelty = isNewDevice ? 1 : 0`
   - `location_anomaly = isUnusualLocation ? 1 : 0`
   - `offpeak_hour_distance`
   - `recent_failed_attempts`
   - `transaction_velocity_1h`
5. **AI Inference**: The Python FastAPI service computes the multi-variate anomaly score, 0–100 risk score, and XAI factor breakdown in $< 0.35\text{ ms}$.
6. **Decision Policy Application**: The decision engine applies policy rules:
   - **`ALLOW`**: Low risk ($\le 35$). Zero customer friction.
   - **`REVIEW`**: Medium risk ($36\text{--}75$). Requires secondary step-up verification.
   - **`BLOCK`**: High risk ($\ge 76$). Instant settlement freeze and fraud alert creation.
7. **Persistence & Telemetry**: Transaction record and any critical alerts are written to MongoDB with indexed fields.
8. **Real-Time Client Push**: Socket.io broadcasts `transaction:new`, `alert:new`, and `dashboard:stats` to all connected browser dashboards.

---

## 3. Technology Stack & Component Matrix

| Tier | Component | Technology | Version | Key Responsibility |
|---|---|---|---|---|
| **Frontend** | Live Command Center | React, Vite, Tailwind CSS, Lucide Icons | React 18, Vite 6 | Real-time dashboard, interactive charts, inspection modals, batch/stream simulation runner |
| **Frontend** | Telemetry Charts | Recharts | 2.15 | Real-time risk trajectory, score distribution histograms, decision action breakdown |
| **Backend** | API Gateway | Node.js, Express.js | Node 20+, Express 4.21 | REST routing, input validation, feature engineering, pipeline orchestration |
| **Backend** | Real-Time Transport | Socket.io | 4.8.1 | Bi-directional sub-second event push to connected dashboards |
| **Backend** | Enterprise Adapter | Node.js Integration Module | 1.0.0 | IBM Z / z/OS CICS/IMS/MQ payload normalization & idempotency management |
| **Backend** | Database Client | MongoDB Official Driver | 6.12.0 | Native high-performance database connection with compound indexes |
| **AI / ML** | Inference Microservice | Python, FastAPI, Uvicorn | Python 3.11, FastAPI 0.115 | Vectorized Isolation Forest, Mahalanobis multi-variate statistical distance |
| **AI / ML** | Numerical Compute | NumPy, SciPy | 2.2 / 1.15 | Ultra-fast vectorized matrix math with zero external C-extension DLL blocks |
| **Database** | Persistence Store | MongoDB Community Server | 8.2.3 | Document store for transactions, customers, alerts, and audit logs |

---

## 4. Latency Budget & SLAs

| Phase | Average Time | Upper Bound SLA |
|---|---|---|
| Schema Validation & Idempotency Check | $0.8\text{ ms}$ | $< 5.0\text{ ms}$ |
| MongoDB Customer Profile Lookup | $1.5\text{ ms}$ | $< 10.0\text{ ms}$ |
| Feature Extraction & Payload Assembly | $0.3\text{ ms}$ | $< 2.0\text{ ms}$ |
| Python ML Anomaly & Risk Inference | $0.28\text{ ms}$ | $< 5.0\text{ ms}$ |
| Decision Policy Engine Evaluation | $0.1\text{ ms}$ | $< 1.0\text{ ms}$ |
| MongoDB Transaction Insert | $2.2\text{ ms}$ | $< 15.0\text{ ms}$ |
| Socket.io WebSocket Broadcast | $0.5\text{ ms}$ | $< 5.0\text{ ms}$ |
| **Total Round-Trip End-to-End** | **$\sim 5.7\text{ ms}$** | **$< 50.0\text{ ms}$** |

---

## 5. Security & Scope Isolation

1. **Simulation Isolation**: All synthetic data is strictly tagged with `isSimulation: true` and labeled `DEMO / SIMULATION DATA`.
2. **Mainframe Demarcation**: The IBM Z adapter is clearly labeled as `ENTERPRISE DEMONSTRATION MODE` with zero claims of unauthenticated live mainframe access.
3. **Input Sanitization**: Strict Joi schema enforcement prevents SQL/NoSQL injection, prototype pollution, and malformed payload propagation.
4. **Idempotency Protection**: Duplicate transaction IDs or replayed enterprise events are rejected with cached previous responses.
