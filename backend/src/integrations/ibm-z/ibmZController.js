const { ibmZAdapter } = require('./ibmZAdapter');
const { ibmZSimulator } = require('./ibmZSimulator');
const { getDb } = require('../../config/db');

function getStatus(req, res) {
  const statusData = ibmZAdapter.getStatus();
  res.json(statusData);
}

async function ingestEvent(req, res, next) {
  try {
    const rawEvent = req.body;
    const result = await ibmZAdapter.processEnterpriseEvent(rawEvent);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function runSimulation(req, res, next) {
  try {
    const { scenario = 'normal', customerId, count, interval_ms } = req.body;
    let result;

    switch (scenario.toLowerCase()) {
      case 'anomaly':
      case 'settlement-anomaly':
        result = await ibmZSimulator.simulateSettlementAnomaly(customerId);
        break;
      case 'attack':
      case 'mainframe-attack':
        result = await ibmZSimulator.simulateMainframeAttack(customerId);
        break;
      case 'batch':
        result = await ibmZSimulator.simulateEnterpriseBatch({
          count: count || 5,
          intervalMs: interval_ms || 200,
          customerId
        });
        break;
      case 'normal':
      default:
        result = await ibmZSimulator.simulateNormalCICS(customerId);
        break;
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function getEnterpriseEvents(req, res, next) {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database service unavailable' });

    const { limit = 25 } = req.query;
    const ibmZEventsCol = db.collection('ibm_z_events');
    const events = await ibmZEventsCol.find({})
      .sort({ receivedAt: -1 })
      .limit(Math.min(parseInt(limit, 10), 100))
      .toArray();

    res.json({
      events,
      total: events.length,
      status: ibmZAdapter.getStatus().status
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStatus,
  ingestEvent,
  runSimulation,
  getEnterpriseEvents
};
