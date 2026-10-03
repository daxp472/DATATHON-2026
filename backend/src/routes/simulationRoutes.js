const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');

// Scenarios
router.get('/scenarios', simulationController.listScenarios);
router.post('/scenario/:id', simulationController.runScenario);

// Custom Transaction Simulation
router.post('/transaction', simulationController.runCustomTransaction);

// Batch & Stream Execution
router.post('/batch', simulationController.runBatch);
router.post('/stream/start', simulationController.startStream);
router.post('/stream/stop', simulationController.stopStream);
router.get('/stream/status', simulationController.getStreamStatus);

// Seeding & Reset & Full Demo Sequence
router.post('/full-demo', simulationController.runFullDemo);
router.post('/seed', simulationController.seedData);
router.delete('/reset', simulationController.resetData);

module.exports = router;

