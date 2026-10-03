const { getDb } = require('../config/db');
const { featureExtractor } = require('../feature-engineering/featureExtractor');
const mlClient = require('./mlClient');
const { decisionEngine } = require('../decision-engine/decisionEngine');
const { patternDetector } = require('./patternDetector');
const { emitTransaction, emitAlert, emitStats, emitCustomerRiskUpdate } = require('../sockets/socketManager');

class TransactionPipeline {
  /**
   * Complete Decision Pipeline Execution with Cross-Transaction Pattern Detection
   * EVENT -> INTELLIGENCE -> PATTERN -> RISK -> EXPLANATION -> DECISION -> ACTION -> MONGODB -> SOCKET.IO
   */
  async process(rawTransaction) {
    const startTime = Date.now();

    // 1. EVENT & FEATURE EXTRACTION
    const features = await featureExtractor.extractFeatures(rawTransaction);

    // 2. QUERY RECENT HISTORY FOR CROSS-TRANSACTION PATTERN DETECTION
    const db = getDb();
    let recentCustomerHistory = [];
    let recentCrossCustomerTxns = [];
    if (db) {
      try {
        const txnsCol = db.collection('transactions');
        [recentCustomerHistory, recentCrossCustomerTxns] = await Promise.all([
          txnsCol.find({ customerId: features.customerId }).sort({ timestamp: -1 }).limit(15).toArray(),
          txnsCol.find({}).sort({ timestamp: -1 }).limit(25).toArray()
        ]);
      } catch (err) {
        console.warn(`[Pipeline] Failed to fetch history for pattern analysis: ${err.message}`);
      }
    }

    // 3. CROSS-TRANSACTION ATTACK PATTERN DETECTION
    const patternResult = patternDetector.detectPatterns(features, recentCustomerHistory, recentCrossCustomerTxns);

    // 4. INTELLIGENCE & RISK (Python FastAPI ML Microservice)
    let mlResult;
    try {
      mlResult = await mlClient.predictRisk(features);
    } catch (mlErr) {
      console.error(`[Pipeline Error] ML Service invocation failed: ${mlErr.message}`);
      throw new Error(`Real-Time AI Pipeline failed: ${mlErr.message}`);
    }

    // If attack pattern detected, append to explanation reasons
    if (patternResult.detected && patternResult.primaryPattern) {
      mlResult.reasons = [
        `PATTERN DETECTED: ${patternResult.primaryPattern.name} — ${patternResult.primaryPattern.description}`,
        ...mlResult.reasons
      ];
      // Elevate risk score only for active compound attacks (ATO, Brute Force, Fraud Ring)
      const criticalAttackIds = ['ACCOUNT_TAKEOVER_COMPOUND', 'REPEATED_FAILED_AUTH', 'CROSS_ACCOUNT_DEVICE_SHARING'];
      if (criticalAttackIds.includes(patternResult.primaryPattern.id)) {
        mlResult.risk_score = Math.max(mlResult.risk_score, 90);
        mlResult.risk_level = 'HIGH';
      }
    }

    // 5. DECISION ENGINE (ALLOW / REVIEW / BLOCK)
    const criticalAttackIds = ['ACCOUNT_TAKEOVER_COMPOUND', 'REPEATED_FAILED_AUTH', 'CROSS_ACCOUNT_DEVICE_SHARING'];
    const contextualFlags = {
      forceBlock: Boolean(rawTransaction.forceBlock) || (patternResult.detected && criticalAttackIds.includes(patternResult.primaryPattern?.id))
    };


    const decision = decisionEngine.evaluate({
      riskScore: mlResult.risk_score,
      riskLevel: mlResult.risk_level,
      reasons: [...mlResult.reasons],
      contextualFlags
    });

    const totalPipelineLatencyMs = Date.now() - startTime;

    // 6. PREPARE STRUCTURED TRANSACTION DOCUMENT
    const transactionRecord = {
      transactionId: features.transactionId,
      customerId: features.customerId,
      amount: features.amount,
      currency: rawTransaction.currency || 'INR',
      timestamp: rawTransaction.timestamp || new Date().toISOString(),
      channel: features.channel,
      sourceSystem: rawTransaction.sourceSystem || features.sourceSystem,
      platform: rawTransaction.platform || 'WEB',
      data_source: rawTransaction.data_source || 'SIMULATION',
      is_demo: rawTransaction.is_demo !== undefined ? rawTransaction.is_demo : true,
      metadata: rawTransaction.metadata || {},
      device: {
        id: rawTransaction.deviceId || features.deviceType,
        type: features.deviceType,
        isNew: features.isNewDevice
      },
      location: {
        name: features.location,
        isUnusual: features.isUnusualLocation
      },
      featuresExtracted: {
        normalCustomerAvg: features.normalCustomerAvg,
        hourOfDay: features.hourOfDay,
        transactionVelocity1h: features.transactionVelocity1h,
        recentFailedAttempts: features.recentFailedAttempts,
        recentSuspiciousAttempts: features.recentSuspiciousAttempts
      },
      riskResult: {
        riskScore: mlResult.risk_score,
        riskLevel: mlResult.risk_level,
        anomalyScore: mlResult.anomaly_score,
        isAnomaly: mlResult.is_anomaly,
        reasons: mlResult.reasons,
        factorBreakdown: mlResult.factor_breakdown,
        modelVersion: mlResult.model_version,
        mlExecutionTimeMs: mlResult.execution_time_ms
      },
      patternDetected: patternResult,
      decision: {
        action: decision.action, // ALLOW | REVIEW | BLOCK
        priority: decision.priority,
        recommendation: decision.recommendation,
        thresholdsApplied: decision.thresholdsApplied,
        evaluatedAt: decision.evaluatedAt
      },
      performance: {
        totalPipelineLatencyMs,
        mlLatencyMs: mlResult.execution_time_ms
      },
      isSimulation: Boolean(rawTransaction.isSimulation),
      simulationLabel: rawTransaction.isSimulation ? 'DEMO / SIMULATION DATA' : 'LIVE PRODUCTION'
    };

    // 7. PERSIST TO MONGODB
    if (db) {
      try {
        const txnsCol = db.collection('transactions');
        await txnsCol.insertOne(transactionRecord);

        // Save risk result audit trail
        const riskResultsCol = db.collection('risk_results');
        await riskResultsCol.insertOne({
          transactionId: transactionRecord.transactionId,
          customerId: transactionRecord.customerId,
          timestamp: transactionRecord.timestamp,
          riskScore: mlResult.risk_score,
          riskLevel: mlResult.risk_level,
          reasons: mlResult.reasons,
          patternDetected: patternResult.detected ? patternResult.primaryPattern?.name : null,
          decision: decision.action
        });

        // If High Risk / Review / Block or Pattern Detected, persist Alert record
        if (decision.action === 'BLOCK' || decision.action === 'REVIEW' || mlResult.risk_score >= 70 || patternResult.detected) {
          const alertsCol = db.collection('alerts');
          const alertDoc = {
            alertId: `ALT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            transactionId: transactionRecord.transactionId,
            customerId: transactionRecord.customerId,
            amount: transactionRecord.amount,
            riskScore: mlResult.risk_score,
            riskLevel: mlResult.risk_level,
            action: decision.action,
            reasons: mlResult.reasons,
            patternDetected: patternResult.detected ? patternResult.primaryPattern : null,
            timestamp: transactionRecord.timestamp,
            severity: decision.action === 'BLOCK' ? 'CRITICAL' : 'WARNING',
            resolved: false,
            isSimulation: transactionRecord.isSimulation
          };
          await alertsCol.insertOne(alertDoc);

          // Emit alert in real time
          emitAlert(alertDoc);
        }

        // 8. UPDATE LIVE CUSTOMER BEHAVIORAL PROFILE & CURRENT RISK STATUS
        const customersCol = db.collection('customers');
        const updateDoc = {
          $set: { 
            lastActive: transactionRecord.timestamp,
            currentRiskScore: mlResult.risk_score,
            currentRiskLevel: mlResult.risk_level,
            lastDecision: decision.action,
            lastPatternDetected: patternResult.detected ? patternResult.primaryPattern?.name : null,
            lastUpdated: new Date().toISOString()
          },
          $inc: { totalTransactions: 1 }
        };

        if (decision.action === 'ALLOW') {
          if (rawTransaction.location) {
            updateDoc.$addToSet = { ...(updateDoc.$addToSet || {}), knownLocations: rawTransaction.location };
          }
          if (rawTransaction.deviceId || rawTransaction.deviceType) {
            updateDoc.$addToSet = { ...(updateDoc.$addToSet || {}), knownDevices: rawTransaction.deviceId || rawTransaction.deviceType };
          }
          updateDoc.$set.recentFailedAttempts = 0;
        }

        await customersCol.updateOne({ customerId: features.customerId }, updateDoc, { upsert: false });

        // Emit real-time customer risk update
        emitCustomerRiskUpdate({
          customerId: features.customerId,
          currentRiskScore: mlResult.risk_score,
          currentRiskLevel: mlResult.risk_level,
          lastDecision: decision.action,
          lastTransactionId: transactionRecord.transactionId,
          patternDetected: patternResult.detected ? patternResult.primaryPattern : null,
          updatedAt: transactionRecord.timestamp
        });
      } catch (dbErr) {
        console.error(`[Pipeline DB Error] Failed to persist transaction: ${dbErr.message}`);
      }
    }

    // 9. REAL-TIME SOCKET.IO BROADCAST (Sub-second dashboard update)
    emitTransaction('transaction:new', transactionRecord);

    // Refresh and emit dashboard summary stats
    this.refreshAndEmitStats().catch(err => console.warn(`[Stats Broadcast Error] ${err.message}`));

    return transactionRecord;
  }


  async refreshAndEmitStats() {
    const db = getDb();
    if (!db) return;

    try {
      const txnsCol = db.collection('transactions');
      const alertsCol = db.collection('alerts');

      const [
        totalCount, 
        allowCount, 
        reviewCount, 
        blockCount, 
        highRiskCount,
        mediumRiskCount,
        lowRiskCount,
        criticalAlertsCount,
        aggregates
      ] = await Promise.all([
        txnsCol.countDocuments(),
        txnsCol.countDocuments({ 'decision.action': 'ALLOW' }),
        txnsCol.countDocuments({ 'decision.action': 'REVIEW' }),
        txnsCol.countDocuments({ 'decision.action': 'BLOCK' }),
        txnsCol.countDocuments({ 'riskResult.riskScore': { $gte: 76 } }),
        txnsCol.countDocuments({ 'riskResult.riskScore': { $gte: 36, $lte: 75 } }),
        txnsCol.countDocuments({ 'riskResult.riskScore': { $lte: 35 } }),
        alertsCol.countDocuments({ resolved: false }),
        txnsCol.aggregate([
          { 
            $group: { 
              _id: null, 
              avgScore: { $avg: '$riskResult.riskScore' },
              totalAmount: { $sum: '$amount' }
            } 
          }
        ]).toArray()
      ]);

      const avgRisk = aggregates.length > 0 ? Math.round(aggregates[0].avgScore || 0) : 0;
      const totalVolume = aggregates.length > 0 ? aggregates[0].totalAmount || 0 : 0;

      const stats = {
        totalTransactions: totalCount,
        decisions: {
          allow: allowCount,
          review: reviewCount,
          block: blockCount
        },
        riskTiers: {
          low: lowRiskCount,
          medium: mediumRiskCount,
          high: highRiskCount
        },
        activeAlerts: criticalAlertsCount,
        averageRiskScore: avgRisk,
        totalVolumeAmount: totalVolume,
        allowRatePct: totalCount > 0 ? Math.round((allowCount / totalCount) * 100) : 100,
        blockRatePct: totalCount > 0 ? Math.round((blockCount / totalCount) * 100) : 0,
        updatedAt: new Date().toISOString()
      };

      emitStats(stats);
      return stats;
    } catch (err) {
      console.warn(`[Pipeline Stats Error] ${err.message}`);
    }
  }
}

const transactionPipeline = new TransactionPipeline();
module.exports = {
  TransactionPipeline,
  transactionPipeline
};
