const client = require('prom-client');

// Initialize default metrics (CPU, memory, event loop, etc.)
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'pulseops_' });

// Custom metrics matching the Spring Boot Micrometer definitions
const checksTotal = new client.Counter({
  name: 'pulseops_monitor_checks_total',
  help: 'Total monitor checks processed by workers',
  registers: [register],
});

const checksSucceeded = new client.Counter({
  name: 'pulseops_monitor_checks_success_total',
  help: 'Successful monitor checks',
  registers: [register],
});

const checksFailed = new client.Counter({
  name: 'pulseops_monitor_checks_failure_total',
  help: 'Failed monitor checks',
  registers: [register],
});

const enqueueFailures = new client.Counter({
  name: 'pulseops_monitor_enqueue_failures_total',
  help: 'Failures while enqueueing monitor checks',
  registers: [register],
});

const checkLatency = new client.Histogram({
  name: 'pulseops_monitor_check_latency',
  help: 'Observed latency for outbound monitor checks in seconds',
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const dispatchBatchSize = new client.Gauge({
  name: 'pulseops_monitor_dispatch_batch_size',
  help: 'Number of due monitors found in the latest scheduler dispatch',
  registers: [register],
});

const recordDispatchSize = (monitorCount) => {
  dispatchBatchSize.set(monitorCount);
};

const recordEnqueueFailure = () => {
  enqueueFailures.inc();
};

const recordCheck = (success, latencyMs) => {
  checksTotal.inc();
  if (success) {
    checksSucceeded.inc();
  } else {
    checksFailed.inc();
  }
  checkLatency.observe(latencyMs / 1000.0);
};

const getMetrics = async () => {
  return await register.metrics();
};

const getContentType = () => {
  return register.contentType;
};

module.exports = {
  register,
  recordDispatchSize,
  recordEnqueueFailure,
  recordCheck,
  getMetrics,
  getContentType,
};
