const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Customer Profiles & Histories
router.get('/customers', customerController.listCustomers);
router.get('/customers/:id/profile', customerController.getCustomerBehavioralProfile);
router.get('/customers/:id/history', customerController.getCustomerHistory);

// AI Investigation & Multi-Dimensional Risk Heatmap
router.get('/investigation/:transactionId', customerController.getInvestigationData);
router.get('/analytics/heatmap', customerController.getRiskHeatmapData);

module.exports = router;
