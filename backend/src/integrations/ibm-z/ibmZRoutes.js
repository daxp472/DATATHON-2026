const express = require('express');
const router = express.Router();
const ibmZController = require('./ibmZController');

// Integration Status & Telemetry
router.get('/status', ibmZController.getStatus);

// Direct Ingestion of Enterprise Event
router.post('/event', ibmZController.ingestEvent);

// Enterprise Simulator
router.post('/simulate', ibmZController.runSimulation);

// Enterprise Audit Trail
router.get('/events', ibmZController.getEnterpriseEvents);

module.exports = router;
