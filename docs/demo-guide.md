# Datathon 2026 — Live Demonstration & Evaluation Guide

> **Project Name:** REAL-TIME AI FRAUD & RISK DECISION ENGINE  
> **Theme:** Real-Time AI for Critical Decisions  
> **Target Presentation Time:** 5 to 10 Minutes  
> **Operational Mode:** Local AI Sandbox with Live WebSocket Telemetry & Standalone IBM Z / z/OS Mainframe Adapter  

---

## 1. Executive Summary for Judges (1 Minute)

Welcome to the **Real-Time AI Fraud & Risk Decision Engine**. 

Financial fraud causes tens of billions in annual losses, yet legacy rule-based engines suffer from high false-positive friction or slow post-facto detection.

Our solution implements an end-to-end, sub-second decision-support system that processes live transaction events:
$$\text{EVENT} \longrightarrow \text{FEATURE EXTRACTION} \longrightarrow \text{PYTHON AI INFERENCE} \longrightarrow \text{EXPLAINABLE FACTORS} \longrightarrow \text{DECISION ENGINE} \longrightarrow \text{AUTONOMOUS ACTION}$$

### Key Highlights:
1. **True Real-Time Stream**: Sub-second latency ($\sim 5\text{--}15\text{ ms}$ total pipeline, $< 0.3\text{ ms}$ ML inference) via React, Socket.io, and Node.js.
2. **Deterministic Risk Calibration**: 0–100 risk score fusing Machine Learning Isolation Trees, Mahalanobis multi-variate statistical distance, and behavioral heuristics.
3. **Autonomous Actions**: Clear operational outcomes — **ALLOW** ($\le 35$), **REVIEW** ($36\text{--}75$), **BLOCK** ($\ge 76$).
4. **Explainable AI (XAI)**: Transparent, human-readable reason codes detailing *why* an action was taken.
5. **Enterprise Ingestion (IBM Z / z/OS)**: Mainframe CICS/IMS/MQ payload normalization with idempotency deduplication.
6. **Zero External API / Real Money Dependencies**: Strictly runs on realistic synthetic test scenarios with clear simulation labeling.

---

## 2. 5–10 Minute Live Demo Walkthrough (Step-by-Step)

### Step 1: System Health & Architecture Overview (1 Minute)
1. Open the Dashboard at `http://localhost:5173`.
2. Point out the top header:
   - **`● DEMO / SIMULATION MODE`** badge
   - **`IBM Z / zOS: DEMO MODE`** indicator
   - **`Stream: LIVE`** WebSocket connection status
3. Click the **`SYSTEM HEALTHY`** button in the navbar to open the real-time microservices inspector modal:
   - Node.js API Gateway (Port 5000)
   - MongoDB Database (Port 27017)
   - Python AI Inference Engine (FastAPI, Port 8000)
   - Real-Time Socket.io Stream
   - IBM Z Demonstration Normalization Adapter

---

### Step 2: One-Click Full Datathon Sequence (2 Minutes)
1. In either the **Live Command Center** or the **Simulation Center**, click **`[ 🎬 START 1-CLICK DEMO ]`**.
2. Watch the automated 5-stage live progression:
   - **Stage 1 (Normal Retail Transaction)**: Amount $\approx$ ₹2,400 $\to$ ML Anomaly Score $0.46$ $\to$ Risk Score $28$ $\to$ **ALLOW** (Green badge).
   - **Stage 2 (Suspicious Step-Up Device)**: Unrecognized device identifier $\to$ Risk Score $48$ $\to$ **REVIEW** (Yellow badge, Step-up MFA trigger).
   - **Stage 3 (Multi-Signal Outlier Attack)**: ₹87,500 (36x baseline) + Romania IP + 03:00 AM + 3 failed logins $\to$ Risk Score $100$ $\to$ **BLOCK** (Red badge) + **Top Critical Alert Flash Banner**.
   - **Stage 4 (IBM Z Normal CICS Transaction)**: Wire transfer ₹45,000 via IBM-Z16 Gateway $\to$ Normalized $\to$ Risk Score $28$ $\to$ **ALLOW**.
   - **Stage 5 (IBM Z Mainframe Security Exploit)**: ₹8,500,000 + Unmapped TN3270 Terminal + RACF failures $\to$ Risk Score $100$ $\to$ **BLOCK** + Critical Alert.
3. Observe how the top **Real-Time Critical Intervention Banner** pulses with the latest blocked anomaly.

---

### Step 3: Deep Feature & Explainable AI Inspection (2 Minutes)
1. On any transaction row in the table, click the **Inspect (Eye icon)** button.
2. The **Transaction Details & AI Explanation Modal** opens:
   - **Composite Risk Score (0-100)** with animated circular gauge and risk level tier.
   - **Autonomous Decision Card**: Recommendation, priority level, and evaluation timestamp.
   - **Explainable AI (XAI) Factor Breakdown**: Each contributing risk factor with severity badges (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
   - **Customer Behavioral Comparison**: Transaction Amount vs Customer Historical Mean baseline.
   - **Signal Context**: Device identifier, geolocation IP, time of day, and 1-hour transaction velocity.
   - **Raw Canonical JSON Payload**: Formatted payload stored in MongoDB.

---

### Step 4: Interactive Simulation & Custom Generator (2 Minutes)
1. Click the **Simulation & Testing Center** tab in the navbar.
2. Demonstrate individual quick scenarios:
   - Click **`4. Unusual Location`** or **`6. High Velocity Burst`**.
   - Show how the decision and score update instantaneously in MongoDB and Socket.io.
3. Demonstrate the **Custom Transaction Generator**:
   - Change Customer to `CUST-1001 (Aarav)`.
   - Set Amount to `₹95,000`.
   - Check `[x] New / Unseen Device` and `[x] Unusual Location`.
   - Click **`SEND CUSTOM TRANSACTION`**.
   - Verify that the transaction is immediately processed by the real Python ML service and flagged as `BLOCK`.
4. Demonstrate the **Batch Runner**:
   - Select `Scenario: Mixed`, `Count: 10`, `Interval: 150ms`.
   - Click **`START BATCH SIMULATION`**.
   - View the completed batch summary with ALLOW/REVIEW/BLOCK counts and average risk score.

---

### Step 5: IBM Z / z/OS Mainframe Enterprise Ingestion (1.5 Minutes)
1. Scroll to the **IBM Z / z/OS Mainframe Simulator** section.
2. Trigger **`IBM Z Settlement Anomaly`** (`CSET` batch wire ₹4,800,000 via Frankfurt bridge).
3. Switch back to the **Live Command Center**:
   - Filter by **`Source: IBM Z`**.
   - Point out the `IBM Z / zOS` source badge and CICS transaction channel codes (`IBM_Z_CWIR`, `IBM_Z_CSET`, `IBM_Z_CADM`).
   - Highlight that enterprise mainframe transactions seamlessly normalize into canonical schema and pass through the identical AI risk pipeline.

---

### Step 6: Telemetry Analytics, CSV Export & Safe Reset (1.5 Minutes)
1. Show the **Real-Time Charts**:
   - **Real-Time Risk Trajectory Chart**: Dynamic Area chart plotting consecutive transactions over time.
   - **Risk Score Distribution Histogram**: Bucketed breakdown (0-20, 21-40, 41-60, 61-80, 81-100).
   - **Autonomous Decision Breakdown**: Interactive Pie chart showing ALLOW vs REVIEW vs BLOCK proportions.
2. Click **`[ 📥 CSV ]`** or **`[ 📥 JSON ]`** above the table to download the full transaction dataset.
3. Click **`Audit Log`** to inspect the real-time immutable event log.
4. If testing cleanup is needed, click **`Reset Demo Data`** in the Simulation Center with built-in safety confirmation.

---

## 3. Anticipated Judge Questions & Technical Answers

| Question | Technical Answer |
|---|---|
| *Is this calling a real banking API or live IBM mainframe?* | No. Per Datathon scope rules, live banking connections are unsafe and out of scope. We built an enterprise adapter that normalizes real-world CICS/IMS/MQ payload structures in **Demonstration Mode** with zero fake results. |
| *What machine learning model is running?* | A pure vectorized **Isolation Forest** paired with **Mahalanobis Multi-Variate Statistical Distance**. It models high-dimensional deviations across amount ratio, device novelty, velocity, hour of day, and failed attempts in $< 0.3\text{ ms}$. |
| *How does the decision engine choose ALLOW / REVIEW / BLOCK?* | Using calibrated policy thresholds: $\le 35$ (ALLOW), $36\text{--}75$ (REVIEW / Step-up verification), and $\ge 76$ (BLOCK). High-impact critical violations (e.g. amount $> 15\times$ baseline + 3 failures) immediately escalate to 100 / BLOCK. |
| *How do you handle duplicate events?* | Dual-tier idempotency manager (in-memory LRU cache + MongoDB query on `eventId` and `transactionId`) returning cached decisions with `isDuplicateEvent: true`. |
| *How fast is the pipeline?* | Total end-to-end round trip is under **15 ms** on commodity hardware, meeting sub-second production SLAs. |
