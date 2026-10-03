const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/healthRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const customerRoutes = require('./routes/customerRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const ibmZRoutes = require('./integrations/ibm-z/ibmZRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl !== '/api/health') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Mount Routes
app.use('/api', healthRoutes);
app.use('/api', transactionRoutes);
app.use('/api', customerRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/integrations/ibm-z', ibmZRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'Real-Time AI Fraud & Risk Decision Engine API Gateway',
    version: '1.0.0',
    status: 'ONLINE',
    endpoints: {
      health: '/api/health',
      transactions: '/api/transactions',
      alerts: '/api/alerts',
      stats: '/api/dashboard/stats',
      analytics: '/api/analytics/risk',
      customers: '/api/customers'
    }
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error(`[Pipeline Error] ${err.message}`, err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
