const { ibmZAdapter } = require('./ibmZAdapter');

class IBMZSimulator {
  /**
   * Enterprise Simulation Scenarios
   */
  async simulateNormalCICS(customerId = 'CUST-DEMO-CORP') {
    const rawEvent = {
      eventId: `ZOS-EVT-NORM-${Date.now()}`,
      cicsTransId: 'CWIR',
      customerId,
      amount: 45000.0,
      currency: 'INR',
      timestamp: new Date().toISOString(),
      hourOfDay: 14,
      terminalId: 'IBM-Z16-CICS-GW01',
      isNewDevice: false,
      location: 'Mainframe Core Datacenter',
      isUnusualLocation: false,
      transactionVelocity1h: 1,
      recentFailedAttempts: 0,
      zosSysplexId: 'SYSPLEX-PROD-01',
      cicsRegion: 'CICSPROD1',
      cicsProgram: 'DFH$WIR1',
      racfUserId: 'ZOSADMIN',
      scenario: 'ibm-z-normal-cics',
      isSimulation: true
    };

    return await ibmZAdapter.processEnterpriseEvent(rawEvent);
  }

  async simulateSettlementAnomaly(customerId = 'CUST-DEMO-CORP') {
    const rawEvent = {
      eventId: `ZOS-EVT-ANOM-${Date.now()}`,
      cicsTransId: 'CSET',
      customerId,
      amount: 4800000.0, // 9.6x normal enterprise baseline
      currency: 'INR',
      timestamp: new Date().toISOString(),
      hourOfDay: 23,
      terminalId: 'Z-OS-BATCH-SETTLEMENT-GW2',
      isNewDevice: true,
      location: 'Frankfurt Branch Bridge',
      isUnusualLocation: true,
      transactionVelocity1h: 2,
      recentFailedAttempts: 0,
      zosSysplexId: 'SYSPLEX-PROD-01',
      cicsRegion: 'CICSBATCH',
      cicsProgram: 'SETTL001',
      racfUserId: 'BATCHOPS',
      scenario: 'ibm-z-settlement-anomaly',
      isSimulation: true
    };

    return await ibmZAdapter.processEnterpriseEvent(rawEvent);
  }

  async simulateMainframeAttack(customerId = 'CUST-DEMO-CORP') {
    const rawEvent = {
      eventId: `ZOS-EVT-ATK-${Date.now()}`,
      cicsTransId: 'CADM',
      customerId,
      amount: 8500000.0, // 17x normal enterprise average
      currency: 'INR',
      timestamp: new Date().toISOString(),
      hourOfDay: 3, // Off-peak 3 AM
      terminalId: 'UNMAPPED-TN3270-EMULATOR-UNKNOWN',
      isNewDevice: true,
      location: 'Bucharest Remote Gateway',
      isUnusualLocation: true,
      transactionVelocity1h: 7, // Velocity spike
      recentFailedAttempts: 4, // Repeated auth failures
      zosSysplexId: 'SYSPLEX-PROD-01',
      cicsRegion: 'CICSPROD1',
      cicsProgram: 'ADMNTX01',
      racfUserId: 'UNAUTHORIZED_ID',
      scenario: 'ibm-z-mainframe-attack',
      isSimulation: true
    };

    return await ibmZAdapter.processEnterpriseEvent(rawEvent);
  }

  async simulateEnterpriseBatch({ count = 5, intervalMs = 200, customerId = 'CUST-DEMO-CORP' }) {
    const results = [];
    for (let i = 0; i < count; i++) {
      const isAttack = i === Math.floor(count / 2);
      const isAnomaly = i === count - 1;

      let res;
      if (isAttack) {
        res = await this.simulateMainframeAttack(customerId);
      } else if (isAnomaly) {
        res = await this.simulateSettlementAnomaly(customerId);
      } else {
        res = await this.simulateNormalCICS(customerId);
      }
      results.push(res);

      if (i < count - 1 && intervalMs > 0) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    return { count: results.length, results };
  }
}

const ibmZSimulator = new IBMZSimulator();
module.exports = {
  IBMZSimulator,
  ibmZSimulator
};
