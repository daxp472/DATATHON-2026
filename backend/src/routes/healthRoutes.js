const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

router.get('/health', healthController.getSystemHealth);
router.get('/health/ml', healthController.getMLHealth);
router.get('/health/db', healthController.getDbHealth);

module.exports = router;
