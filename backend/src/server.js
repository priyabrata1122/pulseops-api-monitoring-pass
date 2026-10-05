const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { initRedis } = require('./config/redis');
const { seedDemoData } = require('./config/dataSeeder');
const { startScheduler, stopScheduler } = require('./jobs/scheduler');
const { startWorker, stopWorker } = require('./jobs/worker');

const PORT = process.env.PORT || 8080;

let server = null;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Initialize Redis (or in-memory fallback)
    initRedis();

    // 3. Seed demo data
    await seedDemoData();

    // 4. Start background jobs
    startScheduler();
    startWorker();

    // 5. Start HTTP server
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`=================================================`);
      console.log(` PulseOps MERN Backend running on port ${PORT}`);
      console.log(` - Health check:    http://localhost:${PORT}/actuator/health`);
      console.log(` - Prometheus:      http://localhost:${PORT}/actuator/prometheus`);
      console.log(` - Swagger UI:      http://localhost:${PORT}/swagger-ui.html`);
      console.log(` - API Base:        http://localhost:${PORT}/api/v1`);
      console.log(`=================================================`);
    });
  } catch (err) {
    console.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  console.log('\nGracefully shutting down PulseOps backend...');
  stopScheduler();
  stopWorker();

  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
    });
  }

  await disconnectDB();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

startServer();

module.exports = { startServer, gracefulShutdown };
