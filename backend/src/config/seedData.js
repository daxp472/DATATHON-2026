const { getDb } = require('./db');

/**
 * Seeds initial customer behavioral baseline profiles if they don't exist.
 */
async function seedInitialCustomers() {
  const db = getDb();
  if (!db) return;

  const customersCollection = db.collection('customers');
  const count = await customersCollection.countDocuments();

  if (count === 0) {
    console.log('[MongoDB Seed] Seeding initial customer behavioral baselines...');
    
    const seedCustomers = [
      {
        customerId: 'CUST-1001',
        name: 'Aarav Sharma',
        email: 'aarav.sharma@example.com',
        normalAvgAmount: 2400.0,
        amountStdDev: 800.0,
        knownDevices: ['DEV-IOS-IPHONE15-AARAV', 'DEV-MACBOOK-PRO-AARAV'],
        knownLocations: ['Mumbai, India', 'Navi Mumbai, India', 'Domestic'],
        riskTier: 'STANDARD',
        totalTransactions: 42,
        recentFailedAttempts: 0,
        createdAt: new Date().toISOString()
      },
      {
        customerId: 'CUST-1002',
        name: 'Priya Patel',
        email: 'priya.patel@example.com',
        normalAvgAmount: 3500.0,
        amountStdDev: 1200.0,
        knownDevices: ['DEV-ANDROID-SAMSUNG-S23', 'DEV-WINDOWS-LAPTOP'],
        knownLocations: ['Bengaluru, India', 'Domestic'],
        riskTier: 'STANDARD',
        totalTransactions: 28,
        recentFailedAttempts: 0,
        createdAt: new Date().toISOString()
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
        totalTransactions: 65,
        recentFailedAttempts: 0,
        createdAt: new Date().toISOString()
      },
      {
        customerId: 'CUST-DEMO-CORP',
        name: 'Enterprise Treasury Z-OS',
        email: 'treasury@zos-bank.example',
        normalAvgAmount: 500000.0,
        amountStdDev: 150000.0,
        knownDevices: ['IBM-Z16-CICS-GW01', 'Z-OS-BATCH-SETTLEMENT'],
        knownLocations: ['Mainframe Core Datacenter', 'Domestic'],
        riskTier: 'ENTERPRISE_INSTITUTIONAL',
        totalTransactions: 1400,
        recentFailedAttempts: 0,
        createdAt: new Date().toISOString()
      }
    ];

    await customersCollection.insertMany(seedCustomers);
    console.log(`[MongoDB Seed] Successfully seeded ${seedCustomers.length} customer profiles.`);
  }
}

module.exports = {
  seedInitialCustomers
};
