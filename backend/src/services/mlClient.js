const axios = require('axios');
const config = require('../config');

class MLClient {
  constructor() {
    this.baseUrl = config.mlServiceUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 3500, // Real-time SLA requires tight response bounds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Health check for Python ML FastAPI Service
   */
  async checkHealth() {
    try {
      const startTime = Date.now();
      const response = await this.client.get('/health');
      const latencyMs = Date.now() - startTime;
      return {
        status: 'HEALTHY',
        latencyMs,
        data: response.data
      };
    } catch (error) {
      return {
        status: 'UNAVAILABLE',
        error: error.message,
        details: error.code || 'ML_SERVICE_OFFLINE'
      };
    }
  }

  /**
   * Request real-time risk intelligence from Python ML service
   * @param {Object} features - Extracted feature vector
   * @returns {Promise<Object>} { risk_score, anomaly_score, risk_level, reasons, model_metadata }
   */
  async predictRisk(features) {
    try {
      const response = await this.client.post('/predict', features);
      return response.data;
    } catch (error) {
      console.error(`[MLClient] Prediction call failed: ${error.message}`);
      if (error.response) {
        throw new Error(`ML Service responded with error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new Error(`ML Service is unreachable at ${this.baseUrl}. Real-time AI pipeline cannot proceed without ML intelligence.`);
      }
      throw error;
    }
  }
}

const mlClient = new MLClient();
module.exports = mlClient;
