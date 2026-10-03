# Real-Time AI Fraud & Risk Decision Engine

> **Official Datathon 2026 Submission**  
> **Theme:** Real-Time AI for Critical Decisions  
> **Core Objective:** Autonomous Sub-Second Decision-Support System for Financial Transactions  
> **Operational Mode:** Local AI Sandbox with Live WebSocket Telemetry & Standalone Enterprise IBM Z / z/OS Mainframe Adapter  

---

## 📋 Executive Overview

Financial institutions process millions of transactions per second. Legacy rules-based systems introduce excessive false-positive customer friction or allow sophisticated fraudsters to slip through.

The **Real-Time AI Fraud & Risk Decision Engine** is an event-driven decision-support platform that analyzes financial transactions in real time:

$$\text{EVENT} \longrightarrow \text{INTELLIGENCE} \longrightarrow \text{RISK (0–100)} \longrightarrow \text{EXPLANATION (XAI)} \longrightarrow \text{DECISION} \longrightarrow \text{AUTONOMOUS ACTION}$$

### ⚡ Supported Autonomous Decisions:
- **`ALLOW` (Score $\le 35$):** Low risk. Transaction conforms to customer historical baseline. Automatically approved.
- **`REVIEW` ($36 \le \text{Score} \le 75$):** Moderate risk. Flagged for Step-Up Verification (MFA / App OTP) or operator review.
- **`BLOCK` (Score $\ge 76$):** Critical anomaly. Transaction settlement is immediately frozen and escalated to fraud ops.

---

## 🏛️ System Architecture

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
                                   │ Sub-Millisecond Prediction (< 0.35ms)
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

## 🛠️ Technology Stack

| Layer | Technologies | Responsibility | Port / URL |
|---|---|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, Socket.io-client | Command center, live stream, real-time trajectory area charts, score histograms, XAI inspector modal | `http://localhost:5173` |
| **Backend Gateway** | Node.js (v20+), Express.js, Socket.io, MongoDB Official Driver | REST ingestion, schema validation, behavioral lookup, feature pipeline, decision thresholds | `http://localhost:5000` |
| **AI / ML Microservice** | Python 3.11, FastAPI, Uvicorn, NumPy, SciPy, Pydantic | Vectorized Isolation Forest, Mahalanobis distance, 0–100 risk scoring, dynamic XAI attribution | `http://localhost:8000` |
| **Enterprise Mainframe Adapter** | Node.js Integration Module (`/backend/src/integrations/ibm-z/`) | CICS/IMS/MQ payload normalization, RACF credential extraction, idempotency caching | `/api/integrations/ibm-z` |
| **Database** | MongoDB Community Server (v8.2+) | High-performance document store with compound indexes (`transactions`, `customers`, `alerts`, `ibm_z_events`) | `127.0.0.1:27017` |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ or v20+
- **Python**: v3.10+ or v3.11+
- **MongoDB**: Active local instance on `127.0.0.1:27017`

---

### 1. Start Python AI / ML Service (Port 8000)
```powershell
cd ml-service
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
*Health Check:* `http://localhost:8000/health`

---

### 2. Start Node.js API Gateway Backend (Port 5000)
```powershell
cd backend
npm start
```
*Health Check:* `http://localhost:5000/api/health`

---

### 3. Start React Live Command Center Frontend (Port 5173)
```powershell
cd frontend
npm run dev
```
*Open Browser:* `http://localhost:5173`

---

## 🎬 5-Minute Live Datathon Demonstration

1. Open `http://localhost:5173` in your browser.
2. Click **`[ 🎬 START 1-CLICK DEMO ]`** in the top banner.
3. Observe the automated 5-stage live progression:
   - **Stage 1 (Normal Retail Transaction):** Amount ₹2,400 $\to$ Risk Score 28 $\to$ **ALLOW** (Green).
   - **Stage 2 (Suspicious Step-Up Device):** Unrecognized device $\to$ Risk Score 48 $\to$ **REVIEW** (Yellow, Step-up MFA).
   - **Stage 3 (Multi-Signal Outlier Attack):** ₹87,500 + Romania IP + 03:00 AM + 3 failed logins $\to$ Risk Score 100 $\to$ **BLOCK** (Red) + Top Alert Flash Banner.
   - **Stage 4 (IBM Z Normal CICS Transaction):** Enterprise CWIR wire ₹45,000 $\to$ Normalized $\to$ Risk Score 28 $\to$ **ALLOW**.
   - **Stage 5 (IBM Z Mainframe Security Attack):** CADM transaction + unmapped terminal + RACF errors $\to$ Risk Score 100 $\to$ **BLOCK**.
4. Click any transaction's **Inspect (Eye icon)** to view deep Explainable AI (XAI) factor breakdowns, behavioral comparisons, and raw canonical JSON.
5. Click **`[ 📥 CSV ]`** or **`[ 📥 JSON ]`** above the table to download the full processed dataset.

---

## 🧪 Automated Testing

Run the full 22-step integration test suite:
```powershell
cd backend
npm test
```

### Test Suite Summary:
```
====================================================
🧪 REAL-TIME AI FRAUD & RISK ENGINE — TEST SUITE
====================================================
• Composite Health Check (Backend, DB, Python ML) ... PASSED
• Validation Middleware Rejects Malformed Transaction ... PASSED
• Scenario 1-9: Normal to Multi-Signal Attack ... PASSED
• Batch Simulation Runner (5 mixed events) ... PASSED
• Customer Profile & History Query ... PASSED
• IBM Z Status (Demonstration Mode Verified) ... PASSED
• IBM Z CICS Normal, Anomaly, & Security Attack ... PASSED
• IBM Z Idempotent Deduplication ... PASSED
• 1-Click 5-Stage Full Demo Sequence ... PASSED
• Transaction Export (CSV & JSON Formats) ... PASSED
• Customer Behavioral Profile & Baseline Aggregation ... PASSED
• AI Investigation Data (Deviations, Baseline, Matrix) ... PASSED
• Risk Heatmap Aggregator (Time, Location, Customer, Amount) ... PASSED
• Cross-Transaction Attack Pattern Detection Engine ... PASSED

📊 TEST SUITE SUMMARY: 26 Passed, 0 Failed
====================================================
```

---

## 📖 Comprehensive Documentation Index

All architectural and operational documentation is located in the [`/docs`](./docs/) directory:

- 🏛️ [`docs/architecture.md`](./docs/architecture.md) — System design, data flow diagrams, microservices contracts, latency SLAs.
- 📡 [`docs/api.md`](./docs/api.md) — Complete REST API routes, schemas, request/response samples, WebSocket events.
- 🧠 [`docs/ml.md`](./docs/ml.md) — Machine Learning feature engineering, Isolation Forest math, Mahalanobis distance, XAI attribution.
- 🔍 [`docs/intelligence.md`](./docs/intelligence.md) — Behavioral profiling, 7-factor risk decomposition, cross-transaction pattern detector, investigation workbench & heatmaps.
- 🧪 [`docs/testing.md`](./docs/testing.md) — Scenario catalog (1-9), batch/stream simulators, database seeding and reset.
- 🏢 [`docs/ibm-z.md`](./docs/ibm-z.md) — Enterprise mainframe CICS/IMS/MQ integration architecture, idempotency, compliance notices.
- 🎬 [`docs/demo-guide.md`](./docs/demo-guide.md) — 5–10 minute presentation walkthrough script for Datathon judges.
- 🔧 [`docs/troubleshooting.md`](./docs/troubleshooting.md) — Quick diagnostics, common issues, port configurations, and resolutions.

---

## 🔒 Safety & Scope Boundaries

- **Strict Simulation Mode:** No real banking networks, payment gateways, or live credit card databases are accessed.
- **Clear Data Labeling:** All synthetic events are explicitly labeled with `DEMO / SIMULATION DATA`.
- **IBM Z Demarcation:** The enterprise adapter operates in **Standalone Demonstration Mode** simulating canonical CICS/IMS/MQ enterprise structures without claiming direct unauthenticated mainframe access.
