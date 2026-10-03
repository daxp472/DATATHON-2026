const http = require('http');
const app = require('./app');
const config = require('./config');
const { connectToDatabase, closeDatabase } = require('./config/db');
const { seedInitialCustomers } = require('./config/seedData');
const { initSocket } = require('./sockets/socketManager');

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server, config.frontendUrl);

async function startServer() {
  try {
    // 1. Connect to MongoDB
    console.log('[Startup] Connecting to MongoDB...');
    await connectToDatabase();

    // 2. Seed Baseline Customer Profiles
    await seedInitialCustomers();

    // 3. Start HTTP & WebSocket Server
    server.listen(config.port, () => {
      console.log('====================================================');
      console.log(`🚀 Fraud Decision Engine Backend is running on port ${config.port}`);
      console.log(`🌐 REST API: http://localhost:${config.port}`);
      console.log(`⚡ WebSocket: ws://localhost:${config.port}`);
      console.log(`🧠 ML Service Target: ${config.mlServiceUrl}`);
      console.log(`📊 Health Endpoint: http://localhost:${config.port}/api/health`);
      console.log(`💳 Ingestion Endpoint: http://localhost:${config.port}/api/transactions`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error(`[Startup Failure] Could not start backend server: ${error.message}`);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n[Shutdown] Closing HTTP server and database connections...');
  server.close();
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Shutdown] SIGTERM received. Cleaning up...');
  server.close();
  await closeDatabase();
  process.exit(0);
});

startServer();
