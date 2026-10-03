const { getDb } = require('../config/db');

/**
 * Rich Synthetic Test Data Seeder
 * Populates customer profiles and realistic historical baseline transactions.
 */
async function seedFullTestData() {
  const db = getDb();
  if (!db) throw new Error('Database is not connected');

  const customersCol = db.collection('customers');
  const txnsCol = db.collection('transactions');

  console.log('[Simulation Seeder] Seeding comprehensive test dataset...');

  // 1. Seed Rich Customer Baselines
  const testCustomers = [
    {
      customerId: 'CUST-1001',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      normalAvgAmount: 2400.0,
      amountStdDev: 800.0,
      knownDevices: ['DEV-IOS-IPHONE15-AARAV', 'DEV-MACBOOK-PRO-AARAV'],
      knownLocations: ['Mumbai, India', 'Navi Mumbai, India', 'Domestic'],
      riskTier: 'STANDARD',
      totalTransactions: 25,
      recentFailedAttempts: 0,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      customerId: 'CUST-1002',
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      normalAvgAmount: 3500.0,
      amountStdDev: 1100.0,
      knownDevices: ['DEV-ANDROID-SAMSUNG-S23', 'DEV-WINDOWS-LAPTOP'],
      knownLocations: ['Bengaluru, India', 'Domestic'],
      riskTier: 'STANDARD',
      totalTransactions: 18,
      recentFailedAttempts: 0,
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      customerId: 'CUST-1003',
      name: 'Rohan Mehta',
      email: 'rohan.mehta@example.com',
      normalAvgAmount: 15000.0,
      amountStdDev: 4500.0,
      knownDevices: ['DEV-IOS-IPHONE14-ROHAN'],
      knownLocations: ['Delhi NCR, India', 'Domestic'],
      riskTier: 'PREMIUM',
      totalTransactions: 32,
      recentFailedAttempts: 0,
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString()
    },
    {
      customerId: 'CUST-DEMO-CORP',
      name: 'Enterprise Treasury Z-OS',
      email: 'treasury@zos-bank.example',
      normalAvgAmount: 500000.0,
      amountStdDev: 120000.0,
      knownDevices: ['IBM-Z16-CICS-GW01', 'Z-OS-BATCH-SETTLEMENT'],
      knownLocations: ['Mainframe Core Datacenter', 'Domestic'],
      riskTier: 'ENTERPRISE_INSTITUTIONAL',
      totalTransactions: 120,
      recentFailedAttempts: 0,
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString()
    }
  ];

  for (const c of testCustomers) {
    await customersCol.updateOne(
      { customerId: c.customerId },
      { $set: c },
      { upsert: true }
    );
  }

  // 2. Generate Realistic Historical Baseline Transactions for CUST-1001
  const historyAmounts = [2100, 2450, 2700, 1950, 3100, 2300, 2600, 2200, 2500, 2800];
  const historicalDocs = historyAmounts.map((amt, idx) => ({
    transactionId: `HIST-TXN-CUST1001-${idx + 1}`,
    customerId: 'CUST-1001',
    amount: amt,
    currency: 'INR',
    timestamp: new Date(Date.now() - (idx + 1) * 3600000 * 4).toISOString(),
    channel: 'ONLINE_BANKING',
    sourceSystem: 'SIMULATION',
    device: {
      id: 'DEV-IOS-IPHONE15-AARAV',
      type: 'Mobile Safari',
      isNew: false
    },
    location: {
      name: 'Mumbai, India',
      isUnusual: false
    },
    featuresExtracted: {
      normalCustomerAvg: 2400.0,
      hourOfDay: 14,
      transactionVelocity1h: 1,
      recentFailedAttempts: 0,
      recentSuspiciousAttempts: 0
    },
    riskResult: {
      riskScore: Math.floor(12 + Math.random() * 15),
      riskLevel: 'LOW',
      anomalyScore: 0.12,
      isAnomaly: false,
      reasons: ['Transaction amount, device, location, and timing conform to established behavioral baseline.'],
      modelVersion: 'VectorizedIsolationForest-v1.3.0',
      mlExecutionTimeMs: 0.2
    },
    decision: {
      action: 'ALLOW',
      priority: 'NORMAL',
      recommendation: 'Authorize transaction. Behavioral patterns within established baseline.',
      evaluatedAt: new Date(Date.now() - (idx + 1) * 3600000 * 4).toISOString()
    },
    performance: { totalPipelineLatencyMs: 3, mlLatencyMs: 0.2 },
    isSimulation: true,
    data_source: 'SIMULATION',
    is_demo: true,
    scenario: 'historical-baseline',
    simulationLabel: 'DEMO / SIMULATION DATA'
  }));

  for (const doc of historicalDocs) {
    await txnsCol.updateOne(
      { transactionId: doc.transactionId },
      { $set: doc },
      { upsert: true }
    );
  }

  console.log('[Simulation Seeder] Baseline history generated successfully.');
  return {
    seededCustomers: testCustomers.length,
    seededHistoricalTransactions: historicalDocs.length
  };
}

/**
 * Safely reset only simulation and demo data (preserving system schema)
 */
async function resetSimulationData() {
  const db = getDb();
  if (!db) throw new Error('Database is not connected');

  console.log('[Simulation Reset] Removing simulation-tagged records...');

  const txnsCol = db.collection('transactions');
  const alertsCol = db.collection('alerts');
  const riskResultsCol = db.collection('risk_results');

  const simQuery = {
    $or: [
      { isSimulation: true },
      { data_source: 'SIMULATION' },
      { is_demo: true }
    ]
  };

  const [txnsDeleted, alertsDeleted, riskDeleted] = await Promise.all([
    txnsCol.deleteMany(simQuery),
    alertsCol.deleteMany(simQuery),
    riskResultsCol.deleteMany({})
  ]);

  console.log(`[Simulation Reset] Removed: ${txnsDeleted.deletedCount} txns, ${alertsDeleted.deletedCount} alerts, ${riskDeleted.deletedCount} risk logs.`);

  return {
    transactionsDeleted: txnsDeleted.deletedCount,
    alertsDeleted: alertsDeleted.deletedCount,
    riskLogsDeleted: riskDeleted.deletedCount,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  seedFullTestData,
  resetSimulationData
};
