const { transactionNormalizer } = require('./transactionNormalizer');
const { idempotencyManager } = require('./idempotencyManager');
const { transactionPipeline } = require('../../services/transactionPipeline');
const { getDb } = require('../../config/db');

class IBMZAdapter {
  constructor() {
    // Determine integration mode based on environment
    this.realZosEndpoint = process.env.ZOS_CONNECT_URL || null;
    this.status = this.realZosEndpoint ? 'CONNECTED' : 'DEMONSTRATION_MODE';
    this.eventsReceivedCount = 0;
    this.eventsProcessedCount = 0;
    this.lastEvent = null;
  }

  /**
   * Returns current integration status and telemetry
   */
  getStatus() {
    return {
      integration: 'IBM Z / z/OS Enterprise Transaction Layer',
      status: this.status, // 'DEMONSTRATION_MODE' | 'CONNECTED'
      isRealConnection: Boolean(this.realZosEndpoint),
      modeDescription: this.realZosEndpoint 
        ? 'Connected to live z/OS Connect Enterprise Gateway' 
        : 'IBM Z / z/OS — DEMONSTRATION MODE (Synthetic Mainframe CICS/IMS Pipeline)',
      endpoint: this.realZosEndpoint || 'Internal Simulation Adapter (Mainframe CICS v5.6 / z16)',
      supportedProtocols: ['z/OS Connect REST API', 'IBM MQ', 'CICS Web Services (SOAP/JSON)', 'Direct Adapter'],
      telemetry: {
        eventsReceived: this.eventsReceivedCount,
        eventsProcessed: this.eventsProcessedCount,
        lastEventTime: this.lastEvent?.timestamp || null,
        lastTransactionId: this.lastEvent?.transactionId || null,
        lastAction: this.lastEvent?.decision?.action || null
      }
    };
  }

  /**
   * Ingest and process an enterprise IBM Z transaction event
   */
  async processEnterpriseEvent(rawEvent) {
    const startTime = Date.now();
    this.eventsReceivedCount++;

    // 1. Check Idempotency (prevent double-spending or replayed MQ messages)
    const duplicateCheck = await idempotencyManager.checkDuplicate(rawEvent.eventId, rawEvent.transactionId);
    if (duplicateCheck && duplicateCheck.isDuplicate) {
      console.log(`[IBM Z Adapter] Idempotent response returned for duplicate event: ${rawEvent.eventId || rawEvent.transactionId}`);
      return {
        ...duplicateCheck.cachedRecord,
        isDuplicateEvent: true,
        message: 'Duplicate enterprise transaction detected. Returned existing decision record.'
      };
    }

    // 2. Normalize IBM Z enterprise format into canonical schema
    const canonicalPayload = transactionNormalizer.normalize(rawEvent);

    // 3. Process through the REAL AI risk and decision pipeline
    const pipelineResult = await transactionPipeline.process(canonicalPayload);
    this.eventsProcessedCount++;
    this.lastEvent = {
      timestamp: new Date().toISOString(),
      transactionId: pipelineResult.transactionId,
      decision: pipelineResult.decision
    };

    // 4. Record in Idempotency cache
    idempotencyManager.recordProcessed(rawEvent.eventId, pipelineResult.transactionId, pipelineResult);

    // 5. Store enterprise audit log in MongoDB 'ibm_z_events' collection
    const db = getDb();
    if (db) {
      try {
        const ibmZEventsCol = db.collection('ibm_z_events');
        await ibmZEventsCol.insertOne({
          eventId: canonicalPayload.eventId,
          transactionId: pipelineResult.transactionId,
          cicsTransId: rawEvent.cicsTransId || 'CWIR',
          customerId: canonicalPayload.customerId,
          amount: canonicalPayload.amount,
          riskScore: pipelineResult.riskResult?.riskScore,
          action: pipelineResult.decision?.action,
          receivedAt: new Date(startTime).toISOString(),
          processedAt: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
          rawEventSnippet: {
            terminalId: canonicalPayload.deviceId,
            facility: canonicalPayload.location,
            sysplexId: canonicalPayload.metadata?.zosSysplexId
          }
        });
      } catch (err) {
        console.warn(`[IBM Z Adapter] Audit log error: ${err.message}`);
      }
    }

    return pipelineResult;
  }
}

const ibmZAdapter = new IBMZAdapter();
module.exports = {
  IBMZAdapter,
  ibmZAdapter
};
