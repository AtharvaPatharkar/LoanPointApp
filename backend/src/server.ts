import http from 'node:http';
import { appHandler } from './app.js';
import { config, validateEnvironment } from './config/index.js';
import { testDbConnection } from './database/index.js';

// 1. Strict Configuration Validation before server startup
validateEnvironment();

const server = http.createServer(appHandler);

// 2. Bind to host (0.0.0.0 enables physical Android devices on the LAN to reach the server)
server.listen(config.port, config.host, async () => {
  console.log(`=======================================================`);
  console.log(`LoanPoint V3 Backend Server Started`);
  console.log(`Listening on: http://${config.host}:${config.port}`);
  console.log(`Environment: ${config.env}`);
  console.log(`OTP Mode: ${config.otpMode.toUpperCase()}`);
  console.log(`Health Check: http://localhost:${config.port}/api/v1/health`);
  console.log(`=======================================================`);

  const dbOk = await testDbConnection();
  if (dbOk) {
    console.log(`[Database] Successfully connected to Neon PostgreSQL!`);
  } else {
    console.warn(`[Database] Warning: Could not connect to Neon PostgreSQL on startup.`);
  }
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => console.log('HTTP server closed'));
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => console.log('HTTP server closed'));
});
