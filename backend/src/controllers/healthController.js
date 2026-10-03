const { checkDbHealth } = require('../config/db');
const mlClient = require('../services/mlClient');
const { getConnectedClientsCount } = require('../sockets/socketManager');
const { decisionEngine } = require('../decision-engine/decisionEngine');

async function getSystemHealth(req, res) {
  const startTime = Date.now();
  
  const [dbHealth, mlHealth] = await Promise.all([
    checkDbHealth(),
    mlClient.checkHealth()
  ]);

  const allHealthy = dbHealth.status === 'HEALTHY' && mlHealth.status === 'HEALTHY';

  const healthPayload = {
    service: 'Fraud Decision Engine Backend',
    status: allHealthy ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    components: {
      backend: {
        status: 'HEALTHY',
        version: '1.0.0',
        nodeVersion: process.version
      },
      database: dbHealth,
      mlService: mlHealth,
      realtimeSockets: {
        status: 'HEALTHY',
        activeClients: getConnectedClientsCount()
      },
      decisionEngine: {
        status: 'READY',
        thresholds: decisionEngine.getThresholds()
      },
      ibmZDemoAdapter: {
        status: 'READY',
        mode: 'ENTERPRISE_DEMONSTRATION_STANDALONE',
        supportedChannels: ['CICS_WEB_SERVICE', 'IMS_GATEWAY', 'MQ_BRIDGE', 'BATCH_EXTRACT'],
        isLiveMainframe: false
      }
    },
    latencyMs: Date.now() - startTime
  };

  const statusCode = allHealthy ? 200 : 207; // 207 Multi-Status if degraded
  res.status(statusCode).json(healthPayload);
}

async function getMLHealth(req, res) {
  const mlHealth = await mlClient.checkHealth();
  res.status(mlHealth.status === 'HEALTHY' ? 200 : 503).json(mlHealth);
}

async function getDbHealth(req, res) {
  const dbHealth = await checkDbHealth();
  res.status(dbHealth.status === 'HEALTHY' ? 200 : 503).json(dbHealth);
}

module.exports = {
  getSystemHealth,
  getMLHealth,
  getDbHealth
};
