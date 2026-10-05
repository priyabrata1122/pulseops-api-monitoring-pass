const Monitor = require('../models/Monitor');
const metricsService = require('../services/metricsService');
const { getRedisClient, isRedisConnected, inMemoryQueue } = require('../config/redis');

const streamName = process.env.STREAM_NAME || 'monitor-checks';
const intervalMs = parseInt(process.env.SCHEDULER_INTERVAL_MS || '30000', 10);

let schedulerTimer = null;

const dispatch = async () => {
  try {
    const cutoff = new Date(Date.now() - 25 * 1000);
    const dueMonitors = await Monitor.find({
      active: true,
      $or: [{ lastCheckedAt: null }, { lastCheckedAt: { $lt: cutoff } }],
    });

    metricsService.recordDispatchSize(dueMonitors.length);
    console.debug(`[Scheduler] Scheduling ${dueMonitors.length} monitors for health check`);

    const redis = getRedisClient();
    const redisAvailable = redis && isRedisConnected();

    for (const monitor of dueMonitors) {
      try {
        const monitorIdStr = monitor._id.toString();
        if (redisAvailable) {
          await redis.xadd(streamName, '*', 'monitorId', monitorIdStr);
        } else {
          inMemoryQueue.push(monitorIdStr);
        }
      } catch (err) {
        metricsService.recordEnqueueFailure();
        console.error(`[Scheduler] Failed to enqueue monitor ${monitor._id}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`[Scheduler] Dispatch error: ${err.message}`);
  }
};

const startScheduler = () => {
  if (process.env.SCHEDULER_ENABLED === 'false') {
    console.log('[Scheduler] Scheduler disabled via environment configuration');
    return;
  }
  console.log(`[Scheduler] Starting MonitorScheduler (interval: ${intervalMs}ms)...`);
  // Run once shortly after start
  setTimeout(dispatch, 2000);
  schedulerTimer = setInterval(dispatch, intervalMs);
};

const stopScheduler = () => {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }
  console.log('[Scheduler] MonitorScheduler stopped');
};

module.exports = {
  startScheduler,
  stopScheduler,
  dispatch,
};
