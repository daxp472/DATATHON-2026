/**
 * IBM Z / z/OS Enterprise Transaction Normalizer
 * Transforms enterprise CICS/IMS/Batch event payloads into the canonical internal transaction schema.
 */

class TransactionNormalizer {
  /**
   * Normalizes an incoming IBM Z / z/OS transaction payload
   * @param {Object} rawEvent - Raw event payload from IBM Z CICS / z/OS Connect API / Simulator
   * @returns {Object} Canonical transaction document ready for the risk pipeline
   */
  normalize(rawEvent) {
    if (!rawEvent) {
      throw new Error('Invalid IBM Z Event: Event payload is missing or null.');
    }

    const eventId = rawEvent.eventId || rawEvent.EVENT_ID || `ZOS-EVT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const cicsTransId = rawEvent.cicsTransId || rawEvent.CICS_TRANS_ID || 'CWIR';
    const customerId = rawEvent.customerId || rawEvent.ACCOUNT_NUMBER || rawEvent.CUSTOMER_ID || 'CUST-DEMO-CORP';
    const amount = Number(rawEvent.amount || rawEvent.TXN_AMOUNT || rawEvent.TRANSACTION_AMOUNT || 0);

    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid IBM Z Event: Amount must be a positive numerical value.');
    }

    const timestamp = rawEvent.timestamp || rawEvent.TIMESTAMP || new Date().toISOString();
    const txnDate = new Date(timestamp);
    const hourOfDay = rawEvent.hourOfDay !== undefined ? Number(rawEvent.hourOfDay) : txnDate.getHours();

    // Device / Mainframe Terminal Mapping
    const terminalId = rawEvent.terminalId || rawEvent.TERMINAL_ID || rawEvent.deviceId || 'IBM-Z16-CICS-GW01';
    const isNewDevice = rawEvent.isNewDevice !== undefined ? Boolean(rawEvent.isNewDevice) : Boolean(rawEvent.UNRECOGNIZED_TERMINAL);

    // Location / Datacenter Facility Mapping
    const location = rawEvent.location || rawEvent.ORIGINATING_FACILITY || 'Mainframe Core Datacenter';
    const isUnusualLocation = rawEvent.isUnusualLocation !== undefined ? Boolean(rawEvent.isUnusualLocation) : Boolean(rawEvent.UNUSUAL_FACILITY);

    // Velocity & Security Signals
    const transactionVelocity1h = Number(rawEvent.transactionVelocity1h || rawEvent.VELOCITY_1H || 1);
    const recentFailedAttempts = Number(rawEvent.recentFailedAttempts || rawEvent.FAILED_AUTH_COUNT || 0);

    const isSimulation = rawEvent.isSimulation !== undefined ? Boolean(rawEvent.isSimulation) : true;
    const dataSource = rawEvent.data_source || (isSimulation ? 'IBM_Z_SIMULATION' : 'IBM_Z');

    const canonicalTxn = {
      transactionId: rawEvent.transactionId || `ZOS-${cicsTransId}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
      eventId,
      customerId,
      amount,
      currency: rawEvent.currency || rawEvent.CURRENCY || 'INR',
      timestamp: txnDate.toISOString(),
      channel: rawEvent.channel || `IBM_Z_${cicsTransId}`,
      sourceSystem: 'IBM_Z',
      platform: 'z/OS',
      
      deviceId: terminalId,
      deviceType: rawEvent.deviceType || `IBM 3270 / CICS Terminal (${terminalId})`,
      isNewDevice,
      
      location: location,
      isUnusualLocation,
      
      hourOfDay,
      transactionVelocity1h,
      recentFailedAttempts,
      recentSuspiciousAttempts: Number(rawEvent.recentSuspiciousAttempts || 0),
      
      data_source: dataSource,
      is_demo: isSimulation,
      isSimulation: isSimulation,
      scenario: rawEvent.scenario || 'ibm-z-enterprise',
      
      metadata: {
        zosSysplexId: rawEvent.zosSysplexId || rawEvent.SYSPLEX_ID || 'SYSPLEX-PROD-01',
        cicsRegion: rawEvent.cicsRegion || rawEvent.CICS_REGION || 'CICSRGN1',
        cicsProgram: rawEvent.cicsProgram || rawEvent.PROGRAM_NAME || 'DFH$WIR1',
        racfUserId: rawEvent.racfUserId || rawEvent.RACF_USER_ID || 'ZOSADMIN',
        normalizedAt: new Date().toISOString(),
        ...(rawEvent.metadata || {})
      }
    };

    return canonicalTxn;
  }
}

const transactionNormalizer = new TransactionNormalizer();
module.exports = {
  TransactionNormalizer,
  transactionNormalizer
};
