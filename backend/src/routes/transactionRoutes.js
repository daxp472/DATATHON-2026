const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { validateTransaction } = require('../middleware/validateTransaction');

// Real-Time Transaction Ingestion Endpoint
router.post('/transactions', validateTransaction, transactionController.createTransaction);

// Transaction Queries & Export
router.get('/transactions/export', transactionController.exportTransactions);
router.get('/transactions', transactionController.getTransactions);
router.get('/transactions/:id', transactionController.getTransactionById);

// Alerts & Telemetry
router.get('/alerts', transactionController.getAlerts);
router.get('/dashboard/stats', transactionController.getDashboardStats);
router.get('/analytics/risk', transactionController.getRiskAnalytics);

module.exports = router;

