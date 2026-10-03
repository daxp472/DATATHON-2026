const { SCENARIOS } = require('../simulation/scenarios/scenarioDefinitions');
const { scenarioRunner } = require('../simulation/scenarioRunner');
const { seedFullTestData, resetSimulationData } = require('../simulation/seedData');

/**
 * Simulation Controller
 */

function listScenarios(req, res) {
  const scenarioList = Object.values(SCENARIOS).map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    expectedRisk: s.expectedRisk,
    expectedDecision: s.expectedDecision
  }));
  res.json({ scenarios: scenarioList, total: scenarioList.length });
}

async function runScenario(req, res, next) {
  try {
    const { id } = req.params;
    const { customerId, customOverrides } = req.body;
    
    const result = await scenarioRunner.runScenario(id, customerId || 'CUST-1001', customOverrides);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function runCustomTransaction(req, res, next) {
  try {
    const result = await scenarioRunner.runCustomTransaction(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function runBatch(req, res, next) {
  try {
    const { scenario = 'normal', count = 10, interval_ms, intervalMs, customerId } = req.body;
    const effectiveInterval = interval_ms || intervalMs || 200;

    const result = await scenarioRunner.runBatch({
      scenario,
      count,
      intervalMs: effectiveInterval,
      customerId
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

function startStream(req, res) {
  const { count = 30, interval_ms = 1000, anomaly_ratio = 0.25, customerId = 'CUST-1001' } = req.body;
  
  scenarioRunner.startStreamSimulation({
    count,
    intervalMs: interval_ms,
    anomalyRatio: anomaly_ratio,
    customerId
  });

  res.json({
    status: 'STREAM_STARTED',
    message: `Continuous stream simulation started for ${count} events.`,
    intervalMs: interval_ms,
    anomalyRatio: anomaly_ratio
  });
}

function stopStream(req, res) {
  scenarioRunner.stopStreamSimulation();
  res.json({ status: 'STREAM_STOPPED', message: 'Stream simulation has been stopped.' });
}

function getStreamStatus(req, res) {
  res.json(scenarioRunner.getStreamingStatus());
}

async function seedData(req, res, next) {
  try {
    const result = await seedFullTestData();
    res.json({ status: 'SUCCESS', message: 'Test baseline dataset seeded successfully.', data: result });
  } catch (error) {
    next(error);
  }
}

async function resetData(req, res, next) {
  try {
    const result = await resetSimulationData();
    res.json({ status: 'SUCCESS', message: 'Simulation dataset safely purged.', data: result });
  } catch (error) {
    next(error);
  }
}

async function runFullDemo(req, res, next) {
  try {
    const { intervalMs = 1200, customerId = 'CUST-1001' } = req.body || {};
    const result = await scenarioRunner.runFullDemoSequence({ intervalMs, customerId });
    res.json({
      status: 'DEMO_SEQUENCE_COMPLETED',
      message: 'Full Datathon demo sequence executed successfully across 5 transaction stages.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listScenarios,
  runScenario,
  runCustomTransaction,
  runBatch,
  startStream,
  stopStream,
  getStreamStatus,
  seedData,
  resetData,
  runFullDemo
};

