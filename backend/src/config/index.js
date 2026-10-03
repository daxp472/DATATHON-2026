require('dotenv').config();

const config = {
  port: parseInt(process.env.BACKEND_PORT || process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
  dbName: process.env.MONGODB_DATABASE || 'fraud_decision_engine',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000',
  
  // Decision Engine Configurable Thresholds
  // Risk score range: 0-100
  decisionThresholds: {
    allowMax: parseInt(process.env.ALLOW_THRESHOLD || '35', 10), // <= 35: ALLOW
    reviewMax: parseInt(process.env.REVIEW_THRESHOLD || '75', 10), // 36 - 75: REVIEW
    blockMin: parseInt(process.env.BLOCK_THRESHOLD || '76', 10)  // >= 76: BLOCK
  }
};

module.exports = config;
