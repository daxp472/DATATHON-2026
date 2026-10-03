const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

async function runTestSuite() {
  console.log(`${colors.bold}${colors.cyan}====================================================`);
  console.log(`🧪 REAL-TIME AI FRAUD & RISK ENGINE — TEST SUITE`);
  console.log(`Target Gateway: ${BASE_URL}`);
  console.log(`====================================================${colors.reset}\n`);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• Running: ${name} ... `);
      await fn();
      console.log(`${colors.green}PASSED${colors.reset}`);
      passed++;
    } catch (err) {
      console.log(`${colors.red}FAILED${colors.reset}`);
      console.error(`  ${colors.red}Error: ${err.message}${colors.reset}`);
      if (err.response) {
        console.error(`  ${colors.red}Server response: ${JSON.stringify(err.response.data)}${colors.reset}`);
      }
      failed++;
    }
  }

  // 1. Health Check
  await test('Composite Health Check (Backend, DB, Python ML)', async () => {
    const res = await axios.get(`${BASE_URL}/api/health`);
    if (res.data.status !== 'HEALTHY') throw new Error(`Health status is ${res.data.status}`);
    if (res.data.components.database.status !== 'HEALTHY') throw new Error('Database not healthy');
    if (res.data.components.mlService.status !== 'HEALTHY') throw new Error('ML Service not healthy');
  });

  // 2. Invalid Transaction Rejection
  await test('Validation Middleware Rejects Malformed Transaction', async () => {
    try {
      await axios.post(`${BASE_URL}/api/transactions`, { amount: -50 });
      throw new Error('Expected 400 Bad Request');
    } catch (err) {
      if (err.response?.status !== 400) throw new Error(`Expected status 400, got ${err.response?.status}`);
    }
  });

  // 3. Scenario 1: Normal Transaction (ALLOW)
  await test('Scenario 1: Normal Transaction -> ALLOW', async () => {
    const res = await axios.post(`${BASE_URL}/api/simulation/scenario/normal`);
    if (res.data.decision.action !== 'ALLOW') throw new Error(`Expected ALLOW, got ${res.data.decision.action}`);
    if (res.data.riskResult.riskScore > 35) throw new Error(`Risk score ${res.data.riskResult.riskScore} exceeds ALLOW threshold`);
    if (!res.data.isSimulation) throw new Error('isSimulation tag missing');
  });

  // 4. Scenario 2: High Amount Deviation
  await test('Scenario 2: High Amount Deviation -> Detected Signal', async () => {
    const res = await axios.post(`${BASE_URL}/api/simulation/scenario/high-amount`);
    const reasons = res.data.riskResult.reasons.join(' ');
    if (!reasons.toLowerCase().includes('higher') && !reasons.toLowerCase().includes('amount')) {
      throw new Error(`Amount deviation explanation not found in: ${reasons}`);
    }
  });

  // 5. Scenario 3: New Device Novelty
  await test('Scenario 3: New Device -> Device Novelty Factor', async () => {
    const res = await axios.post(`${BASE_URL}/api/simulation/scenario/new-device`);
    const reasons = res.data.riskResult.reasons.join(' ');
    if (!reasons.toLowerCase().includes('device')) {
      throw new Error(`Device explanation not found in: ${reasons}`);
    }
  });

  // 6. Scenario 4: Unusual Location
  await test('Scenario 4: Unusual Location -> Location Anomaly Factor', async () => {
    const res = await axios.post(`${BASE_URL}/api/simulation/scenario/unusual-location`);
    const reasons = res.data.riskResult.reasons.join(' ');
    if (!reasons.toLowerCase().includes('location')) {
      throw new Error(`Location explanation not found in: ${reasons}`);
    }
  });

  // 7. Scenario 5: Unusual Time
  await test('Scenario 5: Unusual Time (03:17 AM) -> Temporal Anomaly Factor', async () => {
    const res = await axios.post(`${BASE_URL}/api/simulation/scenario/unusual-time`);
    const reasons = res.data.riskResult.reasons.join(' ');
    if (!reasons.toLowerCase().includes('hour') && !reasons.toLowerCase().includes('time')) {
      throw new Error(`Temporal explanation not found in: ${reasons}`);
    }
  });

  // 8. Scenario 6: High Velocity
  await test('Scenario 6: High Velocity (8 tx/hr) -> Velocity Anomaly Factor', async () => {
    const res = await axios.post(`${BASE_URL}/api/simulation/scenario/high-velocity`);
    const reasons = res.data.riskResult.reasons.join(' ');
    if (!reasons.toLowerCase().includes('velocity') && !reasons.toLowerCase().includes('compound')) {
      throw new Error(`Velocity explanation not found in: ${reasons}`);
    }
  });

  // 9. Scenario 7: Failed Attempts
  await test('Scenario 7: Prior Failed Attempts -> Failure Factor', async () => {
    const res = await axios.post(`${BASE_URL}/api/simulation/scenario/failed-attempts`);
    const reasons = res.data.riskResult.reasons.join(' ');
    if (!reasons.toLowerCase().includes('failed attempt')) {
      throw new Error(`Failed attempts explanation not found in: ${reasons}`);
    }
  });

  // 10. Scenario 8: Sudden Behavioral Change
  await test('Scenario 8: Sudden Behavior Change -> Compound Signals', async () => {
    const res = await axios.post(`${BASE_URL}/api/simulation/scenario/behavior-change`);
    if (res.data.decision.action === 'ALLOW') throw new Error('Behavior change should not be allowed');
    if (res.data.riskResult.reasons.length < 2) throw new Error('Expected multiple compound reasons');
  });

  // 11. Scenario 9: Multi-Signal Coordinated Attack -> BLOCK
  await test('Scenario 9: Multi-Signal Attack -> BLOCK (Score 90-100)', async () => {
    const res = await axios.post(`${BASE_URL}/api/simulation/scenario/multi-signal`);
    if (res.data.decision.action !== 'BLOCK') throw new Error(`Expected BLOCK, got ${res.data.decision.action}`);
    if (res.data.riskResult.riskScore < 76) throw new Error(`Risk score ${res.data.riskResult.riskScore} below BLOCK threshold`);
  });

  // 12. Batch Simulation
  await test('Batch Simulation Runner (5 mixed events sequentially)', async () => {
    const res = await axios.post(`${BASE_URL}/api/simulation/batch`, {
      scenario: 'mixed',
      count: 5,
      interval_ms: 50
    });
    if (res.data.summary.processed !== 5) throw new Error(`Expected 5 processed, got ${res.data.summary.processed}`);
  });

  // 13. Customer History Lookup
  await test('Customer Profile & Transaction History Query', async () => {
    const res = await axios.get(`${BASE_URL}/api/customers/CUST-1001/history`);
    if (!res.data.customer) throw new Error('Customer profile not found');
    if (!Array.isArray(res.data.transactions)) throw new Error('Transaction list not an array');
  });

  // 14. IBM Z Integration Status Endpoint
  await test('IBM Z Status Endpoint (Demonstration Mode Verified)', async () => {
    const res = await axios.get(`${BASE_URL}/api/integrations/ibm-z/status`);
    if (!res.data.status.includes('DEMONSTRATION_MODE') && !res.data.status.includes('CONNECTED')) {
      throw new Error(`Unexpected status: ${res.data.status}`);
    }
    if (res.data.isRealConnection !== false) throw new Error('isRealConnection should be false in local simulation');
  });

  // 15. IBM Z Normal CICS Transaction
  await test('IBM Z Normal CICS Event -> Ingestion & ALLOW', async () => {
    const res = await axios.post(`${BASE_URL}/api/integrations/ibm-z/simulate`, {
      scenario: 'normal',
      customerId: 'CUST-DEMO-CORP'
    });
    if (res.data.sourceSystem !== 'IBM_Z') throw new Error(`Expected sourceSystem IBM_Z, got ${res.data.sourceSystem}`);
    if (res.data.platform !== 'z/OS') throw new Error(`Expected platform z/OS, got ${res.data.platform}`);
    if (res.data.decision.action !== 'ALLOW') throw new Error(`Expected ALLOW, got ${res.data.decision.action}`);
  });

  // 16. IBM Z Settlement Anomaly
  await test('IBM Z Settlement Anomaly -> Elevated Risk & REVIEW/BLOCK', async () => {
    const res = await axios.post(`${BASE_URL}/api/integrations/ibm-z/simulate`, {
      scenario: 'settlement-anomaly',
      customerId: 'CUST-DEMO-CORP'
    });
    if (res.data.decision.action === 'ALLOW') throw new Error('Settlement anomaly should not be automatically allowed');
    if (res.data.riskResult.riskScore < 50) throw new Error(`Expected elevated score, got ${res.data.riskResult.riskScore}`);
  });

  // 17. IBM Z Mainframe Attack
  await test('IBM Z Mainframe Attack -> Score 90-100 & BLOCK', async () => {
    const res = await axios.post(`${BASE_URL}/api/integrations/ibm-z/simulate`, {
      scenario: 'attack',
      customerId: 'CUST-DEMO-CORP'
    });
    if (res.data.decision.action !== 'BLOCK') throw new Error(`Expected BLOCK, got ${res.data.decision.action}`);
    if (res.data.riskResult.riskScore < 85) throw new Error(`Expected high risk score, got ${res.data.riskResult.riskScore}`);
  });

  // 18. IBM Z Direct Ingestion & Idempotency Check
  await test('IBM Z Event Ingestion & Idempotent Deduplication', async () => {
    const uniqueEventId = `ZOS-TEST-IDEMP-${Date.now()}`;
    const enterpriseEvent = {
      eventId: uniqueEventId,
      cicsTransId: 'CWIR',
      customerId: 'CUST-DEMO-CORP',
      amount: 60000.0,
      terminalId: 'IBM-Z16-CICS-GW01',
      isNewDevice: false,
      location: 'Mainframe Core Datacenter',
      isUnusualLocation: false,
      channel: 'IBM_Z_CICS',
      isSimulation: true
    };

    // First call: process
    const res1 = await axios.post(`${BASE_URL}/api/integrations/ibm-z/event`, enterpriseEvent);
    if (!res1.data.transactionId) throw new Error('First event failed to return transactionId');

    // Second call: duplicate
    const res2 = await axios.post(`${BASE_URL}/api/integrations/ibm-z/event`, enterpriseEvent);
    if (!res2.data.isDuplicateEvent) throw new Error('Duplicate event was not caught by Idempotency manager');
  });

  // 19. IBM Z Event Audit Log Query
  await test('IBM Z Event Audit Trail Query (MongoDB ibm_z_events)', async () => {
    const res = await axios.get(`${BASE_URL}/api/integrations/ibm-z/events`);
    if (!Array.isArray(res.data.events)) throw new Error('IBM Z events log is not an array');
    if (res.data.events.length === 0) throw new Error('Expected recorded IBM Z events in audit trail');
  });

  // 20. 1-Click 5-Stage Full Demo Sequence
  await test('1-Click 5-Stage Datathon Full Demo Sequence Execution', async () => {
    const res = await axios.post(`${BASE_URL}/api/simulation/full-demo`, {
      intervalMs: 50,
      customerId: 'CUST-1001'
    });
    if (res.data.status !== 'DEMO_SEQUENCE_COMPLETED') throw new Error(`Unexpected demo status: ${res.data.status}`);
    if (res.data.data?.stagesExecuted !== 5) throw new Error(`Expected 5 stages, got ${res.data.data?.stagesExecuted}`);
  });

  // 21. Transaction Export CSV Format
  await test('Transaction Export (CSV Format)', async () => {
    const res = await axios.get(`${BASE_URL}/api/transactions/export?format=csv&limit=5`);
    if (!res.data.includes('transactionId,customerId,timestamp,amount')) {
      throw new Error('CSV Export does not contain valid CSV header');
    }
  });

  // 22. Transaction Export JSON Format
  await test('Transaction Export (JSON Format)', async () => {
    const res = await axios.get(`${BASE_URL}/api/transactions/export?format=json&limit=5`);
    if (typeof res.data.count !== 'number' || !Array.isArray(res.data.transactions)) {
      throw new Error('JSON Export does not contain valid count or transactions array');
    }
  });

  // 23. Customer Behavioral Profile
  await test('Customer Behavioral Profile & Baseline Aggregation', async () => {
    const res = await axios.get(`${BASE_URL}/api/customers/CUST-1001/profile`);
    if (!res.data.baselineMetrics?.normalAmount) {
      throw new Error('Customer profile missing baselineMetrics.normalAmount');
    }
    if (!Array.isArray(res.data.behavioralPatterns?.usualHours)) {
      throw new Error('Customer profile missing usualHours distribution array');
    }
  });

  // 24. AI Investigation Workbench Endpoint
  await test('AI Investigation Data (Deviations, Baseline, Related Transactions)', async () => {
    const txnsRes = await axios.get(`${BASE_URL}/api/transactions?limit=1`);
    const targetId = txnsRes.data.transactions[0]?.transactionId;
    if (!targetId) throw new Error('No transaction found for investigation test');

    const res = await axios.get(`${BASE_URL}/api/investigation/${targetId}`);
    if (!res.data.targetTransaction?.transactionId) {
      throw new Error('Investigation response missing targetTransaction');
    }
    if (!Array.isArray(res.data.detectedDeviations)) {
      throw new Error('Investigation response missing detectedDeviations array');
    }
    if (!res.data.relatedTransactions) {
      throw new Error('Investigation response missing relatedTransactions object');
    }
  });

  // 25. Multi-Dimensional Risk Heatmap Aggregator
  await test('Risk Heatmap Aggregator (Time, Location, Customer, Amount)', async () => {
    const res = await axios.get(`${BASE_URL}/api/analytics/heatmap`);
    if (!Array.isArray(res.data.timeVsRisk) || res.data.timeVsRisk.length !== 24) {
      throw new Error('Risk heatmap missing 24-hour timeVsRisk array');
    }
    if (!Array.isArray(res.data.locationVsRisk)) {
      throw new Error('Risk heatmap missing locationVsRisk array');
    }
    if (!Array.isArray(res.data.amountVsRisk)) {
      throw new Error('Risk heatmap missing amountVsRisk array');
    }
  });

  // 26. Multi-Transaction Attack Pattern Detection
  await test('Cross-Transaction Attack Pattern Detection Engine', async () => {
    const res = await axios.post(`${BASE_URL}/api/simulation/scenario/multi-signal`, {
      customerId: 'CUST-1001'
    });
    if (!res.data.patternDetected) {
      throw new Error('Multi-signal transaction did not attach patternDetected object');
    }
    if (res.data.decision?.action !== 'BLOCK') {
      throw new Error(`Expected BLOCK decision for attack pattern, got ${res.data.decision?.action}`);
    }
  });

  console.log(`\n====================================================`);
  console.log(`📊 TEST SUITE SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`====================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }

}

if (require.main === module) {
  runTestSuite();
}

module.exports = { runTestSuite };
