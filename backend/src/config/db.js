const { MongoClient } = require('mongodb');
const config = require('./index');

let client = null;
let db = null;

async function connectToDatabase() {
  if (db) return db;

  try {
    client = new MongoClient(config.mongoUri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000
    });

    await client.connect();
    db = client.db(config.dbName);
    console.log(`[MongoDB] Connected successfully to database: ${config.dbName}`);

    // Ensure collections and proper indexes for high-throughput querying
    await initializeIndexes(db);

    return db;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
}

async function initializeIndexes(database) {
  try {
    const transactions = database.collection('transactions');
    await transactions.createIndex({ transactionId: 1 }, { unique: true, sparse: true });
    await transactions.createIndex({ customerId: 1, timestamp: -1 });
    await transactions.createIndex({ timestamp: -1 });
    await transactions.createIndex({ 'riskResult.riskScore': -1 });
    await transactions.createIndex({ 'decision.action': 1 });
    await transactions.createIndex({ isSimulation: 1 });

    const customers = database.collection('customers');
    await customers.createIndex({ customerId: 1 }, { unique: true });

    const alerts = database.collection('alerts');
    await alerts.createIndex({ timestamp: -1 });
    await alerts.createIndex({ resolved: 1, severity: 1 });

    const riskResults = database.collection('risk_results');
    await riskResults.createIndex({ transactionId: 1 });
    await riskResults.createIndex({ timestamp: -1 });

    console.log('[MongoDB] Collection indexes verified successfully.');
  } catch (err) {
    console.warn(`[MongoDB] Index creation notice: ${err.message}`);
  }
}

function getDb() {
  return db;
}

async function checkDbHealth() {
  if (!db || !client) {
    return { status: 'DOWN', message: 'Not connected' };
  }
  try {
    await db.command({ ping: 1 });
    return { status: 'HEALTHY', database: config.dbName };
  } catch (err) {
    return { status: 'DEGRADED', error: err.message };
  }
}

async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('[MongoDB] Connection closed.');
  }
}

module.exports = {
  connectToDatabase,
  getDb,
  checkDbHealth,
  closeDatabase
};
