const config = require('../config');

/**
 * Decision Engine Module
 * Evaluates ML risk score and contextual flags against configurable business thresholds.
 * Thresholds:
 * - ALLOW:  riskScore <= allowMax (default <= 35)
 * - REVIEW: allowMax < riskScore < blockMin (default 36-75)
 * - BLOCK:  riskScore >= blockMin (default >= 76)
 */
class DecisionEngine {
  constructor(customThresholds = {}) {
    this.thresholds = {
      ...config.decisionThresholds,
      ...customThresholds
    };
  }

  evaluate({ riskScore, riskLevel, reasons = [], contextualFlags = {} }) {
    const score = Math.max(0, Math.min(100, Math.round(riskScore)));
    let action = 'ALLOW';
    let priority = 'LOW';
    let recommendation = 'Approve transaction automatically.';

    if (score >= this.thresholds.blockMin) {
      action = 'BLOCK';
      priority = 'CRITICAL';
      recommendation = 'Immediately reject and prevent transaction settlement. Flag account for investigation.';
    } else if (score > this.thresholds.allowMax) {
      action = 'REVIEW';
      priority = 'MEDIUM';
      recommendation = 'Hold transaction for secondary multi-factor authentication (MFA) or operator verification.';
    } else {
      action = 'ALLOW';
      priority = 'NORMAL';
      recommendation = 'Authorize transaction. Behavioral patterns within established baseline.';
    }

    // Hard override if critical velocity or known blacklisted criteria are flagged
    if (contextualFlags.forceBlock) {
      action = 'BLOCK';
      priority = 'CRITICAL';
      recommendation = 'Hard rule override: Transaction blocked due to critical risk policy violation.';
      reasons.unshift('Hard policy violation triggered immediate block.');
    }

    return {
      action, // ALLOW | REVIEW | BLOCK
      priority, // NORMAL | MEDIUM | CRITICAL
      riskScore: score,
      riskLevel: riskLevel || this.inferRiskLevel(score),
      recommendation,
      thresholdsApplied: {
        allowThreshold: this.thresholds.allowMax,
        reviewThreshold: this.thresholds.reviewMax,
        blockThreshold: this.thresholds.blockMin
      },
      evaluatedAt: new Date().toISOString()
    };
  }

  inferRiskLevel(score) {
    if (score >= 76) return 'HIGH';
    if (score >= 36) return 'MEDIUM';
    return 'LOW';
  }

  updateThresholds(newThresholds) {
    this.thresholds = {
      ...this.thresholds,
      ...newThresholds
    };
    return this.thresholds;
  }

  getThresholds() {
    return { ...this.thresholds };
  }
}

const defaultDecisionEngine = new DecisionEngine();

module.exports = {
  DecisionEngine,
  decisionEngine: defaultDecisionEngine
};
