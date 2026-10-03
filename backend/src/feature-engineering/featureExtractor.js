const { getDb } = require('../config/db');

/**
 * Feature Extractor Layer
 * Extracts behavioral and contextual signals against historical MongoDB baselines.
 */
class FeatureExtractor {
  async extractFeatures(rawTransaction) {
    const db = getDb();
    const customerId = rawTransaction.customerId;
    const amount = Number(rawTransaction.amount);
    
    // Parse transaction timestamp and compute hour of day (0-23)
    const txnDate = rawTransaction.timestamp ? new Date(rawTransaction.timestamp) : new Date();
    const hourOfDay = rawTransaction.hourOfDay !== undefined ? Number(rawTransaction.hourOfDay) : txnDate.getHours();

    let normalCustomerAvg = 2500.0;
    let customerStdDev = 800.0;
    let isNewDevice = false;
    let isUnusualLocation = false;
    let recentFailedAttempts = Number(rawTransaction.recentFailedAttempts || 0);
    let recentSuspiciousAttempts = Number(rawTransaction.recentSuspiciousAttempts || 0);
    let transactionVelocity1h = 1;

    if (db) {
      try {
        // 1. Fetch Customer Baseline Profile
        const customersCol = db.collection('customers');
        const customer = await customersCol.findOne({ customerId });

        if (customer) {
          normalCustomerAvg = customer.normalAvgAmount || normalCustomerAvg;
          customerStdDev = customer.amountStdDev || (normalCustomerAvg * 0.35);

          // Check device familiarity
          if (rawTransaction.deviceId || rawTransaction.deviceType) {
            const devId = (rawTransaction.deviceId || rawTransaction.deviceType).trim();
            const knownDevs = customer.knownDevices || [];
            isNewDevice = !knownDevs.some(kd => kd.toLowerCase() === devId.toLowerCase());
          }

          // Check location familiarity
          if (rawTransaction.location) {
            const loc = rawTransaction.location.trim();
            const knownLocs = customer.knownLocations || [];
            isUnusualLocation = !knownLocs.some(kl => kl.toLowerCase() === loc.toLowerCase());
          }

          if (customer.recentFailedAttempts) {
            recentFailedAttempts = Math.max(recentFailedAttempts, customer.recentFailedAttempts);
          }
        } else {
          // New customer without baseline profile
          isNewDevice = true;
          isUnusualLocation = false;
        }

        // 2. Compute 1-Hour Rolling Transaction Velocity from MongoDB
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const txnsCol = db.collection('transactions');
        const recentTxnCount = await txnsCol.countDocuments({
          customerId,
          timestamp: { $gte: oneHourAgo }
        });
        
        transactionVelocity1h = (recentTxnCount || 0) + 1;
      } catch (err) {
        console.warn(`[FeatureExtractor] Baseline lookup notice: ${err.message}`);
      }
    }

    // Explicit override from incoming simulation payload if provided
    if (rawTransaction.isNewDevice !== undefined) {
      isNewDevice = Boolean(rawTransaction.isNewDevice);
    }
    if (rawTransaction.isUnusualLocation !== undefined) {
      isUnusualLocation = Boolean(rawTransaction.isUnusualLocation);
    }
    if (rawTransaction.normalCustomerAvg !== undefined) {
      normalCustomerAvg = Number(rawTransaction.normalCustomerAvg);
    }
    if (rawTransaction.transactionVelocity1h !== undefined) {
      transactionVelocity1h = Number(rawTransaction.transactionVelocity1h);
    }

    // Build structured feature payload for Python ML Service
    return {
      transactionId: rawTransaction.transactionId,
      customerId,
      amount,
      normalCustomerAvg,
      customerStdDev,
      transactionTime: txnDate.toISOString(),
      hourOfDay,
      isNewDevice,
      isUnusualLocation,
      deviceType: rawTransaction.deviceType || rawTransaction.deviceId || 'Standard Web Browser',
      location: rawTransaction.location || 'Primary Region',
      recentFailedAttempts,
      recentSuspiciousAttempts,
      transactionVelocity1h,
      channel: rawTransaction.channel || 'ONLINE_BANKING',
      sourceSystem: rawTransaction.sourceSystem || (rawTransaction.isSimulation ? 'SIMULATION' : 'LIVE_GATEWAY'),
      metadata: rawTransaction.metadata || {}
    };
  }
}

const featureExtractor = new FeatureExtractor();
module.exports = {
  FeatureExtractor,
  featureExtractor
};
