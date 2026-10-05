const axios = require('axios');
const Monitor = require('../models/Monitor');
const monitorService = require('../services/monitorService');
const checkResultService = require('../services/checkResultService');
const incidentService = require('../services/incidentService');
const alertService = require('../services/alertService');
const metricsService = require('../services/metricsService');
const { getRedisClient, isRedisConnected, inMemoryQueue } = require('../config/redis');

const streamName = process.env.STREAM_NAME || 'monitor-checks';
const groupName = process.env.CONSUMER_GROUP || 'workers';
const consumerName = process.env.CONSUMER_NAME || 'worker-1';

let isWorkerRunning = false;
let workerLoopTimeout = null;

const processMonitor = async (monitorId) => {
  let monitor;
  try {
    monitor = await monitorService.getEntityById(monitorId);
  } catch (err) {
    console.warn(`[Worker] Monitor ${monitorId} not found: ${err.message}`);
    return;
  }

  const start = Date.now();
  let statusCode = null;
  let errorMessage = null;
  let success = false;

  try {
    const timeout = (monitor.timeoutSeconds || 10) * 1000;
    const method = (monitor.method || 'GET').toLowerCase();

    const response = await axios({
      method,
      url: monitor.url,
      timeout,
      validateStatus: () => true, // Don't throw on 4xx/5xx status codes
    });

    statusCode = response.status;
    success = statusCode === (monitor.expectedStatusCode || 200);
    if (!success) {
      errorMessage = `Expected ${monitor.expectedStatusCode} but got ${statusCode}`;
    }
  } catch (err) {
    errorMessage = `${err.name || 'Error'}: ${err.message}`;
    success = false;
  }

  const latencyMs = Date.now() - start;
  metricsService.recordCheck(success, latencyMs);

  try {
    await checkResultService.save(monitor, statusCode, latencyMs, success, errorMessage);
    await monitorService.updateLastCheckedAt(monitor._id);

    if (!success) {
      const wasDown = await incidentService.hasOpenIncident(monitor._id);
      await incidentService.openOrUpdate(monitor, errorMessage || 'Check failed');
      if (!wasDown) {
        await alertService.fireAlerts(monitor, `Monitor ${monitor.name} is DOWN: ${errorMessage}`);
      }
    } else {
      const wasDown = await incidentService.hasOpenIncident(monitor._id);
      await incidentService.resolveIfOpen(monitor);
      if (wasDown) {
        await alertService.fireAlerts(monitor, `Monitor ${monitor.name} has RECOVERED`);
      }
    }

    console.debug(`[Worker] Checked ${monitor.url} -> success=${success} latency=${latencyMs}ms status=${statusCode}`);
  } catch (err) {
    console.error(`[Worker] Error recording check for monitor ${monitor._id}: ${err.message}`);
  }
};

const ensureStreamAndGroup = async (redis) => {
  try {
    await redis.xgroup('CREATE', streamName, groupName, '$', 'MKSTREAM');
  } catch (err) {
    // Group already exists, which is fine
  }
};

const runRedisLoop = async () => {
  const redis = getRedisClient();
  if (!redis || !isRedisConnected()) {
    // Process from inMemoryQueue if Redis is not connected
    while (inMemoryQueue.length > 0) {
      const monitorId = inMemoryQueue.shift();
      if (monitorId) {
        processMonitor(monitorId).catch((err) => console.error('[Worker]', err));
      }
    }
    if (isWorkerRunning) {
      workerLoopTimeout = setTimeout(runRedisLoop, 2000);
    }
    return;
  }

  try {
    await ensureStreamAndGroup(redis);
    const results = await redis.xreadgroup(
      'GROUP',
      groupName,
      consumerName,
      'COUNT',
      10,
      'BLOCK',
      2000,
      'STREAMS',
      streamName,
      '>'
    );

    if (results && results.length > 0) {
      for (const [stream, messages] of results) {
        for (const [id, fields] of messages) {
          // fields is [key1, val1, key2, val2, ...]
          let monitorId = null;
          for (let i = 0; i < fields.length; i += 2) {
            if (fields[i] === 'monitorId') {
              monitorId = fields[i + 1];
              break;
            }
          }
          if (monitorId) {
            processMonitor(monitorId).catch((err) => console.error('[Worker]', err));
          }
          await redis.xack(streamName, groupName, id);
        }
      }
    }
  } catch (err) {
    if (isWorkerRunning) {
      console.debug(`[Worker] Loop error: ${err.message}`);
    }
  }

  if (isWorkerRunning) {
    workerLoopTimeout = setTimeout(runRedisLoop, 500);
  }
};

const startWorker = () => {
  if (process.env.WORKER_ENABLED === 'false') {
    console.log('[Worker] Worker disabled via environment configuration');
    return;
  }
  isWorkerRunning = true;
  console.log('[Worker] Starting MonitorWorker...');
  runRedisLoop();
};

const stopWorker = () => {
  isWorkerRunning = false;
  if (workerLoopTimeout) {
    clearTimeout(workerLoopTimeout);
  }
  console.log('[Worker] MonitorWorker stopped');
};

module.exports = {
  startWorker,
  stopWorker,
  processMonitor,
};
