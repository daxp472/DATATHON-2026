# IBM Z / z/OS Enterprise Transaction Integration & Architecture

> **Official Scope & Compliance Notice:**
> In local development and datathon demonstration mode, the system operates using a clearly labeled **IBM Z / z/OS DEMONSTRATION MODE**. There is no live mainframe connection claimed. All simulated enterprise events are tagged with `data_source: "IBM_Z_SIMULATION"`, `source_system: "IBM_Z"`, and `platform: "z/OS"`.

---

## 1. Enterprise Integration Architecture

The IBM Z integration layer acts as a standardized ingestion boundary that normalizes enterprise mainframe transaction feeds into the canonical real-time AI decision pipeline:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      IBM Z / z/OS TRANSACTION SOURCE                   │
│  (z/OS Connect REST API • IBM MQ • CICS Web Services • Demo Adapter)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Enterprise CICS / IMS Payload)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   IBM Z INTEGRATION ADAPTER & NORMALIZER               │
│          (/backend/src/integrations/ibm-z/ibmZAdapter.js)              │
│                                                                        │
│  • Idempotency Check (Deduplication against replays/retries)           │
│  • Schema Normalization (Maps CICS/RACF fields to Canonical Model)     │
│  • Enterprise Audit Trail (Persists to MongoDB 'ibm_z_events')         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Canonical Transaction Document)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   EXISTING NODE.JS TRANSACTION PIPELINE                │
│                                                                        │
│  Feature Extraction ──▶ Python ML Engine ──▶ Decision Engine (ALLOW/..)│
│                                                     │                  │
│                                                     ▼                  │
│                                             MongoDB + Socket.io        │
│                                                     │                  │
│                                                     ▼                  │
│                                         React Live Command Center      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Enterprise Ingestion & Normalization Contract

### Input: Raw IBM Z Mainframe CICS Event (`POST /api/integrations/ibm-z/event`)
```json
{
  "eventId": "ZOS-EVT-900412",
  "cicsTransId": "CWIR",
  "customerId": "CUST-DEMO-CORP",
  "amount": 45000.0,
  "currency": "INR",
  "timestamp": "2026-10-03T14:30:00Z",
  "terminalId": "IBM-Z16-CICS-GW01",
  "isNewDevice": false,
  "location": "Mainframe Core Datacenter",
  "isUnusualLocation": false,
  "zosSysplexId": "SYSPLEX-PROD-01",
  "cicsRegion": "CICSPROD1",
  "cicsProgram": "DFH$WIR1",
  "racfUserId": "ZOSADMIN"
}
```

### Output: Canonical Model Processed via Decision Pipeline
```json
{
  "transactionId": "ZOS-CWIR-900412-101",
  "customerId": "CUST-DEMO-CORP",
  "amount": 45000.0,
  "channel": "IBM_Z_CWIR",
  "sourceSystem": "IBM_Z",
  "platform": "z/OS",
  "data_source": "IBM_Z_SIMULATION",
  "is_demo": true,
  "device": { "id": "IBM-Z16-CICS-GW01", "type": "IBM 3270 / CICS Terminal", "isNew": false },
  "location": { "name": "Mainframe Core Datacenter", "isUnusual": false },
  "riskResult": {
    "riskScore": 18,
    "riskLevel": "LOW",
    "reasons": ["Transaction amount, device, location, and timing conform to established behavioral baseline."]
  },
  "decision": {
    "action": "ALLOW",
    "recommendation": "Authorize transaction. Behavioral patterns within established baseline."
  }
}
```

---

## 3. Idempotency & Deduplication Strategy

To protect against duplicate processing across network retries or message queue replays:
1. Every incoming enterprise transaction is keyed by `eventId` and `transactionId`.
2. The [`idempotencyManager.js`](file:///d:/Hackathon/Datathon/backend/src/integrations/ibm-z/idempotencyManager.js) checks an in-memory fast cache and the MongoDB `transactions` collection.
3. If a duplicate is received within the retention window (10 minutes), the system immediately returns the existing decision record with `isDuplicateEvent: true` without invoking the ML service again.

---

## 4. Predefined IBM Z Scenarios

1. **`IBM Z Normal CICS Transaction`** (`POST /api/integrations/ibm-z/simulate` with `scenario: 'normal'`):
   - Standard account debit of ₹45,000 against corporate baseline (avg ₹500,000) on known terminal `IBM-Z16-CICS-GW01`. $\rightarrow$ **`ALLOW`**.
2. **`IBM Z Settlement Anomaly`** (`scenario: 'settlement-anomaly'`):
   - Large cross-border wire of ₹4,800,000 (9.6x baseline) via unmapped Frankfurt bridge. $\rightarrow$ **`REVIEW / BLOCK`**.
3. **`IBM Z Mainframe Attack`** (`scenario: 'attack'`):
   - Unmapped TN3270 terminal emulator, off-peak 03:00 AM, ₹8,500,000 amount, 4 RACF security failures. $\rightarrow$ **`BLOCK (Score 100)`**.

---

## 5. Production Connectivity vs Demonstration Mode

| Capability | Demonstration Mode (Current) | Production IBM Z Environment |
|---|---|---|
| **Ingestion Endpoint** | `POST /api/integrations/ibm-z/event` | z/OS Connect EE REST endpoint or IBM MQ Listener |
| **Data Format** | JSON CICS Event Payload | EBCDIC / Copybook converted to JSON by z/OS Connect |
| **Connection Status** | `IBM Z / zOS — DEMONSTRATION MODE` | `IBM Z / zOS — CONNECTED` (verified via ping handshake) |
| **Deduplication** | Idempotency Manager (In-Memory + Mongo) | Idempotency Manager (Redis / Mongo Cluster) |
| **Decision Pipeline** | **Identical Real Pipeline** | **Identical Real Pipeline** |
