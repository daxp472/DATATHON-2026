const { SCENARIOS } = require('../scenarios/scenarioDefinitions');
const { getDb } = require('../../config/db');

let sequenceCounter = 1000;

class TransactionGenerator {
  /**
   * Generates a fully synthetic demo transaction payload for a specific scenario
   */
  async generateScenarioTransaction(scenarioKey = 'NORMAL', customerId = 'CUST-1001', customOverrides = {}) {
    sequenceCounter++;
    const key = Object.keys(SCENARIOS).find(
      k => k.toLowerCase() === scenarioKey.toLowerCase() || SCENARIOS[k].id.toLowerCase() === scenarioKey.toLowerCase()
    ) || 'NORMAL';

    const scenarioDef = SCENARIOS[key];
    
    // Fetch customer profile from MongoDB if available
    let customer = null;
    const db = getDb();
    if (db) {
      try {
        customer = await db.collection('customers').findOne({ customerId });
      } catch (err) {
        console.warn(`[Generator] Customer lookup warning: ${err.message}`);
      }
    }

    if (!customer) {
      customer = {
        customerId,
        normalAvgAmount: 2400.0,
        amountStdDev: 800.0,
        knownDevices: ['DEV-IOS-IPHONE15-AARAV'],
        knownLocations: ['Mumbai, India', 'Domestic']
      };
    }

    const templateData = scenarioDef.template(customer);
    const txnId = `SIM-TXN-${Date.now().toString().slice(-6)}-${String(sequenceCounter).padStart(4, '0')}`;

    const payload = {
      transactionId: customOverrides.transactionId || txnId,
      customerId,
      amount: customOverrides.amount !== undefined ? Number(customOverrides.amount) : templateData.amount,
      currency: customOverrides.currency || 'INR',
      timestamp: customOverrides.timestamp || new Date().toISOString(),
      
      deviceId: customOverrides.deviceId || templateData.deviceId,
      deviceType: customOverrides.deviceType || templateData.deviceType || 'Mobile Safari',
      isNewDevice: customOverrides.isNewDevice !== undefined ? Boolean(customOverrides.isNewDevice) : templateData.isNewDevice,
      
      location: customOverrides.location || templateData.location,
      isUnusualLocation: customOverrides.isUnusualLocation !== undefined ? Boolean(customOverrides.isUnusualLocation) : templateData.isUnusualLocation,
      
      hourOfDay: customOverrides.hourOfDay !== undefined ? Number(customOverrides.hourOfDay) : templateData.hourOfDay,
      transactionVelocity1h: customOverrides.transactionVelocity1h !== undefined ? Number(customOverrides.transactionVelocity1h) : templateData.transactionVelocity1h,
      recentFailedAttempts: customOverrides.recentFailedAttempts !== undefined ? Number(customOverrides.recentFailedAttempts) : templateData.recentFailedAttempts,
      recentSuspiciousAttempts: customOverrides.recentSuspiciousAttempts !== undefined ? Number(customOverrides.recentSuspiciousAttempts) : templateData.recentSuspiciousAttempts,
      channel: customOverrides.channel || templateData.channel,
      
      // Simulation and Demo Safety Labels
      data_source: 'SIMULATION',
      is_demo: true,
      isSimulation: true,
      scenario: scenarioDef.id,
      metadata: {
        environment: 'development',
        scenarioName: scenarioDef.name,
        expectedRisk: scenarioDef.expectedRisk,
        expectedDecision: scenarioDef.expectedDecision,
        generator_version: '1.0',
        generated_at: new Date().toISOString(),
        ...(customOverrides.metadata || {})
      }
    };

    return payload;
  }

  /**
   * Generates a custom transaction from user inputs, strictly tagging as simulation
   */
  generateCustomTransaction(inputs = {}) {
    sequenceCounter++;
    const txnId = inputs.transactionId || `SIM-TXN-${Date.now().toString().slice(-6)}-${String(sequenceCounter).padStart(4, '0')}`;

    return {
      transactionId: txnId,
      customerId: inputs.customerId || inputs.customer_id || 'CUST-1001',
      amount: Number(inputs.amount || 2400),
      currency: inputs.currency || 'INR',
      timestamp: inputs.timestamp || new Date().toISOString(),
      
      deviceId: inputs.deviceId || inputs.device_id || 'DEV-CUSTOM-001',
      deviceType: inputs.deviceType || inputs.device_type || 'Custom Simulator Client',
      isNewDevice: inputs.isNewDevice !== undefined ? Boolean(inputs.isNewDevice) : (inputs.device_new !== undefined ? Boolean(inputs.device_new) : false),
      
      location: inputs.location || 'Mumbai, India',
      isUnusualLocation: inputs.isUnusualLocation !== undefined ? Boolean(inputs.isUnusualLocation) : (inputs.location_deviation !== undefined ? Boolean(inputs.location_deviation) : false),
      
      hourOfDay: inputs.hourOfDay !== undefined ? Number(inputs.hourOfDay) : (inputs.hour_of_day !== undefined ? Number(inputs.hour_of_day) : new Date().getHours()),
      transactionVelocity1h: Number(inputs.transactionVelocity1h || inputs.transaction_velocity || 1),
      recentFailedAttempts: Number(inputs.recentFailedAttempts || inputs.failed_attempts || 0),
      recentSuspiciousAttempts: Number(inputs.recentSuspiciousAttempts || inputs.suspicious_attempts || 0),
      channel: inputs.channel || 'ONLINE_BANKING',
      
      data_source: 'SIMULATION',
      is_demo: true,
      isSimulation: true,
      scenario: 'custom-simulation',
      metadata: {
        environment: 'development',
        scenarioName: 'User Custom Transaction',
        generator_version: '1.0',
        generated_at: new Date().toISOString()
      }
    };
  }
}

const transactionGenerator = new TransactionGenerator();
module.exports = {
  TransactionGenerator,
  transactionGenerator
};
