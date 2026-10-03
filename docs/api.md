# REST API & WebSocket Protocol Specifications

> **Base Gateway URL:** `http://localhost:5000`  
> **ML Service URL:** `http://localhost:8000`  
> **Protocol:** HTTP/1.1 (JSON), WebSocket (Socket.io)  

---

## 1. System Health Endpoints

### Composite System Health
- **Endpoint:** `GET /api/health`
- **Description:** Checks composite health across Node.js backend, MongoDB database, Python ML microservice, real-time WebSocket connections, decision engine, and IBM Z demo adapter.
- **Sample Response (200 OK):**
```json
{
  "service": "Fraud Decision Engine Backend",
  "status": "HEALTHY",
  "timestamp": "2026-10-03T07:36:02.701Z",
  "uptimeSeconds": 482,
  "components": {
    "backend": { "status": "HEALTHY", "version": "1.0.0", "nodeVersion": "v20+" },
    "database": { "status": "HEALTHY", "database": "fraud_decision_engine" },
    "mlService": {
      "status": "HEALTHY",
      "latencyMs": 1,
      "data": { "service": "AI / ML Anomaly Detection Service", "model": "VectorizedIsolationForest-v1.3.0" }
    },
    "realtimeSockets": { "status": "HEALTHY", "activeClients": 1 },
    "decisionEngine": { "status": "READY", "thresholds": { "allowMax": 35, "reviewMax": 75, "blockMin": 76 } },
    "ibmZDemoAdapter": { "status": "READY", "mode": "ENTERPRISE_DEMONSTRATION_STANDALONE", "isLiveMainframe": false }
  },
  "latencyMs": 9
}
```

---

## 2. Core Transaction & Ingestion Endpoints

### Ingest Transaction
- **Endpoint:** `POST /api/transactions`
- **Description:** Primary ingestion point for live transactions. Extracts features, calls Python ML, computes risk score, evaluates decision thresholds, saves to MongoDB, and broadcasts to WebSocket clients.
- **Request Body:**
```json
{
  "transactionId": "TXN-2026-9001",
  "customerId": "CUST-1001",
  "amount": 87500.0,
  "currency": "INR",
  "channel": "ONLINE_BANKING",
  "device": { "id": "DEV-UNRECOGNIZED-EMULATOR", "type": "Android Script Emulator", "isNew": true },
  "location": { "name": "Bucharest, Romania", "isUnusual": true },
  "isSimulation": true
}
```
- **Response (201 Created):**
```json
{
  "transactionId": "TXN-2026-9001",
  "customerId": "CUST-1001",
  "amount": 87500,
  "currency": "INR",
  "timestamp": "2026-10-03T07:36:08.188Z",
  "riskResult": {
    "riskScore": 100,
    "riskLevel": "HIGH",
    "anomalyScore": 0.8014,
    "isAnomaly": true,
    "reasons": [
      "Transaction amount (INR 87,500.00) is significantly higher (36.5x) than customer average (INR 2,400.00).",
      "Device has not previously been associated with this customer profile.",
      "Transaction location (Bucharest, Romania) differs from historical customer geographic cluster."
    ],
    "factorBreakdown": [
      { "feature": "AMOUNT_DEVIATION", "impact": "CRITICAL", "description": "36.5x above baseline" },
      { "feature": "NEW_DEVICE", "impact": "HIGH", "description": "Unrecognized device" }
    ],
    "modelVersion": "VectorizedIsolationForest-v1.3.0",
    "mlExecutionTimeMs": 0.28
  },
  "decision": {
    "action": "BLOCK",
    "priority": "CRITICAL",
    "recommendation": "Immediately reject and prevent transaction settlement. Flag account for investigation.",
    "evaluatedAt": "2026-10-03T07:36:08.194Z"
  },
  "performance": { "totalPipelineLatencyMs": 6, "mlLatencyMs": 0.28 },
  "isSimulation": true,
  "simulationLabel": "DEMO / SIMULATION DATA"
}
```

### Query Transactions
- **Endpoint:** `GET /api/transactions`
- **Query Params:** `page`, `limit`, `decision` (`ALL`, `ALLOW`, `REVIEW`, `BLOCK`), `riskLevel`, `customerId`, `search`

### Single Transaction Inspector
- **Endpoint:** `GET /api/transactions/:id`

### Export Transactions (CSV & JSON)
- **Endpoint:** `GET /api/transactions/export?format=csv&limit=1000`
- **Endpoint:** `GET /api/transactions/export?format=json&limit=1000`
- **Description:** Direct file download stream in CSV spreadsheet format or structured JSON array.

---

## 3. Alerts & Real-Time Telemetry Endpoints

### Active Alerts
- **Endpoint:** `GET /api/alerts?limit=20`

### Dashboard Executive Stats
- **Endpoint:** `GET /api/dashboard/stats`
- **Response:**
```json
{
  "totalTransactions": 142,
  "decisions": { "allow": 118, "review": 12, "block": 12 },
  "riskTiers": { "low": 118, "medium": 12, "high": 12 },
  "activeAlerts": 12,
  "averageRiskScore": 31,
  "totalVolumeAmount": 3482500,
  "allowRatePct": 83,
  "blockRatePct": 8,
  "timestamp": "2026-10-03T07:36:08.200Z"
}
```

### Risk Analytics & Distribution
- **Endpoint:** `GET /api/analytics/risk`

---

## 4. Simulation & Testing Endpoints

### List Standard Scenarios
- **Endpoint:** `GET /api/simulation/scenarios`

### Run Specific Scenario
- **Endpoint:** `POST /api/simulation/scenario/:id` (`normal`, `high-amount`, `new-device`, `unusual-location`, `unusual-time`, `high-velocity`, `failed-attempts`, `behavior-change`, `multi-signal`)

### Run Custom Generator
- **Endpoint:** `POST /api/simulation/transaction`

### Run Batch Runner
- **Endpoint:** `POST /api/simulation/batch`

### 1-Click 5-Stage Full Demo Sequence
- **Endpoint:** `POST /api/simulation/full-demo`
- **Request Body:** `{ "intervalMs": 800, "customerId": "CUST-1001" }`
- **Response:**
```json
{
  "status": "DEMO_SEQUENCE_COMPLETED",
  "message": "Full Datathon demo sequence executed successfully across 5 transaction stages.",
  "data": {
    "status": "DEMO_COMPLETED",
    "stagesExecuted": 5,
    "totalSteps": 5,
    "executedAt": "2026-10-03T07:36:08.220Z"
  }
}
```

### Seed Baseline Dataset
- **Endpoint:** `POST /api/simulation/seed`

### Safe Demo Reset
- **Endpoint:** `DELETE /api/simulation/reset`

---

## 5. IBM Z Mainframe Integration Endpoints

### Adapter Status
- **Endpoint:** `GET /api/integrations/ibm-z/status`

### Run IBM Z Demonstration Scenario
- **Endpoint:** `POST /api/integrations/ibm-z/simulate` (Body: `{ "scenario": "normal" | "anomaly" | "attack" }`)

### Direct Enterprise Event Ingestion (with Idempotency)
- **Endpoint:** `POST /api/integrations/ibm-z/event`

### IBM Z Audit Trail
- **Endpoint:** `GET /api/integrations/ibm-z/events`

---

## 6. Socket.io Real-Time Events

| Event Name | Direction | Payload Description |
|---|---|---|
| `transaction:new` | Server $\to$ Client | Full transaction record immediately following decision engine execution |
| `alert:new` | Server $\to$ Client | High-priority payload when risk score $\ge 76$ or decision is `BLOCK` |
| `dashboard:stats` | Server $\to$ Client | Updated executive metrics counts |
