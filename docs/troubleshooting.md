# Troubleshooting & Operations Guide

This guide provides diagnostics, common issues, and operational solutions for the **Real-Time AI Fraud & Risk Decision Engine**.

---

## 1. Quick Diagnostic Checklist

When experiencing any system issue, perform these quick checks:

```powershell
# 1. Check Python ML Service Health
Invoke-RestMethod -Uri http://localhost:8000/health

# 2. Check Backend Gateway & Database Health
Invoke-RestMethod -Uri http://localhost:5000/api/health

# 3. Check IBM Z Enterprise Adapter Status
Invoke-RestMethod -Uri http://localhost:5000/api/integrations/ibm-z/status

# 4. Run Automated Test Suite
cd backend; npm test
```

---

## 2. Common Issues & Solutions

### 1. Python ML Service (`Port 8000`) Fails to Start

**Symptom:** Backend health reports `mlService: DOWN` or `ECONNREFUSED 127.0.0.1:8000`.

**Root Cause:**
- Python virtual environment is not activated or uvicorn is not running.
- Port 8000 is occupied by another local service.
- Windows AppLocker / WDAC blocks binary C-extensions (`.pyd`).

**Solution:**
1. Start the ML service using the project virtual environment:
   ```powershell
   cd ml-service
   .\.venv\Scripts\Activate.ps1
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```
2. Note: The engine uses a pure NumPy/SciPy `VectorizedIsolationForest` designed specifically to run without binary DLL restrictions.

---

### 2. MongoDB Connection Refused (`Port 27017`)

**Symptom:** Backend crashes on startup with `[Startup Failure] MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`.

**Root Cause:** Local MongoDB Community Server is stopped.

**Solution:**
1. Start MongoDB via Windows Services or PowerShell:
   ```powershell
   net start MongoDB
   # Or launch mongod directly:
   mongod --dbpath="C:\data\db"
   ```
2. Test connection with `mongosh`:
   ```powershell
   mongosh --eval "db.adminCommand('ping')"
   ```

---

### 3. Backend Gateway (`Port 5000`) Port Conflict

**Symptom:** `Error: listen EADDRINUSE: address already in use :::5000`.

**Solution:**
1. Find and terminate the process holding port 5000:
   ```powershell
   Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess
   Stop-Process -Id <PID> -Force
   ```
2. Restart backend:
   ```powershell
   cd backend
   npm run start
   ```

---

### 4. Real-Time Socket.io Stream Shows "OFFLINE" in Navbar

**Symptom:** Navbar badge shows `Stream: OFFLINE (Red)`.

**Root Cause:**
- Backend server is stopped or restarted while the frontend is open.
- Firewall or CORS block on WebSocket handshake.

**Solution:**
1. Verify backend is running on `http://localhost:5000`.
2. Click the `[ 🔄 Refresh ]` button in the navbar to reconnect.
3. Check browser developer console (`F12`) for any CORS or network errors.

---

### 5. Missing Test Customers or Empty Baseline Comparisons

**Symptom:** Custom transactions return `normalCustomerAvg: 0` or empty comparisons.

**Solution:**
1. In the **Simulation & Testing Center**, click **`[ Seed Baseline History ]`**.
2. Or run via backend script:
   ```powershell
   cd backend
   npm run seed:test
   ```
3. This seeds standard test profiles: `CUST-1001` (Aarav), `CUST-1002` (Priya), `CUST-1003` (Rohan), and `CUST-DEMO-CORP` (IBM Z Treasury).

---

### 6. Need to Clear Demo / Simulation Data from MongoDB

**Solution:**
1. In the **Simulation & Testing Center**, click **`[ Reset Demo Data ]`** and confirm the safety prompt.
2. Or run via backend command line:
   ```powershell
   cd backend
   npm run reset:test
   ```
3. All demo transactions and alerts are safely purged while preserving customer baseline profiles.

---

## 3. Environment Variables Reference

### Backend (`/backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/fraud_decision_engine
ML_SERVICE_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### ML Service (`/ml-service/.env`):
```env
HOST=127.0.0.1
PORT=8000
LOG_LEVEL=info
```
