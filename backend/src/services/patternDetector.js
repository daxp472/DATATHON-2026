/**
 * Multi-Transaction Attack & Fraud Pattern Detection Engine
 * 
 * Analyzes behavioral trajectories across multiple transactions to detect
 * coordinated attack signatures, account takeovers, velocity bursts, and fraud rings.
 */

class PatternDetector {
  /**
   * Detect patterns across current event and customer's transaction history
   * @param {Object} current - Engineered features of current transaction
   * @param {Array} history - Recent historical transactions for this customer
   * @param {Array} crossCustomerTxns - Recent transactions across all customers (optional for device reuse)
   * @returns {Object} Detected pattern details or null
   */
  detectPatterns(current, history = [], crossCustomerTxns = []) {
    const patterns = [];
    const now = new Date(current.timestamp || Date.now()).getTime();

    // 1. RAPID TRANSACTION BURST (Velocity / Bot Flood)
    const tenMinutesAgo = now - 10 * 60 * 1000;
    const recent10mCount = history.filter(t => new Date(t.timestamp).getTime() >= tenMinutesAgo).length;
    if (recent10mCount >= 3 || current.transactionVelocity1h >= 6) {
      patterns.push({
        id: 'RAPID_TRANSACTION_BURST',
        name: 'Rapid Transaction Burst',
        severity: 'HIGH',
        confidence: 0.91,
        description: `High-frequency velocity detected: ${recent10mCount + 1} transactions initiated in a compressed timeframe.`,
        signalsMatched: ['HIGH_VELOCITY', 'COMPRESSED_TIMEFRAME'],
        mitigation: 'Enforce temporary 15-minute rate limit on payment attempts.'
      });
    }

    // 2. REPEATED FAILED AUTHENTICATION (Brute-Force / Credential Stuffing)
    if (current.recentFailedAttempts >= 3) {
      patterns.push({
        id: 'REPEATED_FAILED_AUTH',
        name: 'Repeated Authentication Failures',
        severity: 'CRITICAL',
        confidence: 0.95,
        description: `${current.recentFailedAttempts} failed authentication/PIN attempts preceded this high-value payment.`,
        signalsMatched: ['AUTH_FAILURES', 'CREDENTIAL_STUFFING'],
        mitigation: 'Lock session and require multi-factor biometric reverification.'
      });
    }

    // 3. SUDDEN AMOUNT ESCALATION (Card Testing / Bust-Out)
    if (history.length >= 1) {
      const lastTxn = history[0];
      const amountRatio = current.normalCustomerAvg > 0 ? (current.amount / current.normalCustomerAvg) : 1;
      if (lastTxn.amount < current.normalCustomerAvg * 1.5 && amountRatio >= 6) {
        patterns.push({
          id: 'SUDDEN_AMOUNT_ESCALATION',
          name: 'Sudden Amount Escalation',
          severity: 'HIGH',
          confidence: 0.89,
          description: `Transaction amount escalated sharply from ₹${lastTxn.amount?.toLocaleString()} to ₹${current.amount?.toLocaleString()} (${amountRatio.toFixed(1)}x baseline).`,
          signalsMatched: ['AMOUNT_LADDERING', 'SPIKE_AFTER_LOW_VALUE'],
          mitigation: 'Hold transaction for step-up secondary authorization.'
        });
      }
    }

    // 4. ACCOUNT TAKEOVER COMPOUND (ATO Signature)
    if (current.isNewDevice && current.isUnusualLocation && (current.amount > current.normalCustomerAvg * 2 || current.hourOfDay < 6)) {
      patterns.push({
        id: 'ACCOUNT_TAKEOVER_COMPOUND',
        name: 'Account Takeover (ATO) Signature',
        severity: 'CRITICAL',
        confidence: 0.96,
        description: 'Coordinated ATO signature: Unrecognized device operating from foreign location during off-peak hours.',
        signalsMatched: ['NEW_DEVICE', 'UNUSUAL_LOCATION', 'OFF_PEAK_WINDOW'],
        mitigation: 'Immediate operational block and automated security dispatch.'
      });
    }

    // 5. SUSTAINED HIGH-RISK CAMPAIGN
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const highRisk24h = history.filter(t => 
      new Date(t.timestamp).getTime() >= oneDayAgo && 
      ((t.riskResult?.riskScore || 0) >= 70 || t.decision?.action === 'BLOCK')
    );
    const hasCurrentRiskSignal = current.isNewDevice || current.isUnusualLocation || (current.recentFailedAttempts || 0) > 0 || (current.normalCustomerAvg > 0 && current.amount > current.normalCustomerAvg * 1.8) || current.transactionVelocity1h >= 4;
    if (highRisk24h.length >= 2 && hasCurrentRiskSignal) {
      patterns.push({
        id: 'SUSTAINED_HIGH_RISK_CAMPAIGN',
        name: 'Sustained High-Risk Attack Campaign',
        severity: 'CRITICAL',
        confidence: 0.93,
        description: `Customer account has experienced ${highRisk24h.length} blocked or high-risk events in the past 24 hours.`,
        signalsMatched: ['REPEATED_BLOCKS', 'PERSISTENT_ADVERSARY'],
        mitigation: 'Freeze account cards and dispatch to fraud investigations desk.'
      });
    }


    // 6. CROSS-ACCOUNT DEVICE REUSE (Fraud Ring / Mule Cluster)
    if (crossCustomerTxns.length > 0 && current.deviceId && !current.deviceId.includes('KNOWN')) {
      const otherCustomersWithDevice = crossCustomerTxns.filter(t => 
        t.device?.id === current.deviceId && t.customerId !== current.customerId
      );
      if (otherCustomersWithDevice.length >= 1) {
        const uniqueOtherCusts = [...new Set(otherCustomersWithDevice.map(t => t.customerId))];
        patterns.push({
          id: 'CROSS_ACCOUNT_DEVICE_SHARING',
          name: 'Fraud Ring Device Sharing',
          severity: 'CRITICAL',
          confidence: 0.97,
          description: `Device ID ${current.deviceId} was also used by ${uniqueOtherCusts.length} other customer account(s) (${uniqueOtherCusts.join(', ')}).`,
          signalsMatched: ['DEVICE_REUSE', 'FRAUD_RING_INDICATOR'],
          mitigation: 'Blacklist device fingerprint across entire organization.'
        });
      }
    }

    if (patterns.length === 0) {
      return {
        detected: false,
        patterns: [],
        primaryPattern: null
      };
    }

    // Sort by severity (CRITICAL > HIGH > MEDIUM)
    const severityOrder = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
    patterns.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));

    return {
      detected: true,
      patterns,
      primaryPattern: patterns[0],
      totalPatterns: patterns.length
    };
  }
}

const patternDetector = new PatternDetector();
module.exports = {
  PatternDetector,
  patternDetector
};
