const { Server } = require('socket.io');

let io = null;
let connectedClients = 0;

function initSocket(httpServer, allowedOrigin = '*') {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigin,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    connectedClients++;
    console.log(`[Socket.io] Client connected: ${socket.id} (Total: ${connectedClients})`);

    socket.emit('system:connected', {
      message: 'Connected to Real-Time AI Fraud & Risk Decision Engine Stream',
      timestamp: new Date().toISOString(),
      socketId: socket.id
    });

    socket.on('disconnect', () => {
      connectedClients = Math.max(0, connectedClients - 1);
      console.log(`[Socket.io] Client disconnected: ${socket.id} (Total: ${connectedClients})`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet.');
  }
  return io;
}

function emitTransaction(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

function emitAlert(alert) {
  if (io) {
    io.emit('alert:new', alert);
  }
}

function emitStats(stats) {
  if (io) {
    io.emit('dashboard:stats', stats);
  }
}

function emitCustomerRiskUpdate(customerUpdate) {
  if (io) {
    io.emit('customer:risk_updated', customerUpdate);
  }
}


function getConnectedClientsCount() {
  return connectedClients;
}

module.exports = {
  initSocket,
  getIO,
  emitTransaction,
  emitAlert,
  emitStats,
  emitCustomerRiskUpdate,
  getConnectedClientsCount
};

