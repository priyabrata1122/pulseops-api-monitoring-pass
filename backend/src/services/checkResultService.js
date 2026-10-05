const CheckResult = require('../models/CheckResult');
const Monitor = require('../models/Monitor');

const formatCheckResultSummary = (cr, monitor) => {
  const m = monitor || cr.monitor;
  return {
    id: cr._id.toString(),
    monitorId: m ? (m._id ? m._id.toString() : m.toString()) : null,
    monitorName: m && m.name ? m.name : '',
    monitorUrl: m && m.url ? m.url : '',
    statusCode: cr.statusCode,
    latencyMs: cr.latencyMs,
    success: cr.success,
    errorMessage: cr.errorMessage || null,
    checkedAt: cr.checkedAt,
  };
};

const save = async (monitor, statusCode, latencyMs, success, errorMessage) => {
  const result = new CheckResult({
    monitor: monitor._id,
    statusCode,
    latencyMs,
    success,
    errorMessage: errorMessage || null,
    checkedAt: new Date(),
  });
  return await result.save();
};

const getLatestByProject = async (projectId, limit = 20) => {
  const monitors = await Monitor.find({ project: projectId }).select('_id name url');
  const monitorMap = new Map();
  monitors.forEach((m) => monitorMap.set(m._id.toString(), m));

  const monitorIds = monitors.map((m) => m._id);
  if (monitorIds.length === 0) return [];

  const results = await CheckResult.find({ monitor: { $in: monitorIds } })
    .sort({ checkedAt: -1 })
    .limit(limit);

  return results.map((r) => formatCheckResultSummary(r, monitorMap.get(r.monitor.toString())));
};

const getByMonitor = async (monitorId, limit = 50) => {
  const monitor = await Monitor.findById(monitorId).select('_id name url');
  const results = await CheckResult.find({ monitor: monitorId })
    .sort({ checkedAt: -1 })
    .limit(limit);

  return results.map((r) => formatCheckResultSummary(r, monitor));
};

const getUptimePercentage = async (projectId, since) => {
  const monitors = await Monitor.find({ project: projectId }).select('_id');
  const monitorIds = monitors.map((m) => m._id);
  if (monitorIds.length === 0) return 100.0;

  const total = await CheckResult.countDocuments({
    monitor: { $in: monitorIds },
    checkedAt: { $gte: since },
  });

  if (total === 0) return 100.0;

  const success = await CheckResult.countDocuments({
    monitor: { $in: monitorIds },
    success: true,
    checkedAt: { $gte: since },
  });

  return (success * 100.0) / total;
};

const getAvgLatency = async (projectId, since) => {
  const monitors = await Monitor.find({ project: projectId }).select('_id');
  const monitorIds = monitors.map((m) => m._id);
  if (monitorIds.length === 0) return 0.0;

  const agg = await CheckResult.aggregate([
    {
      $match: {
        monitor: { $in: monitorIds },
        success: true,
        checkedAt: { $gte: since },
        latencyMs: { $ne: null },
      },
    },
    {
      $group: {
        _id: null,
        avgLatency: { $avg: '$latencyMs' },
      },
    },
  ]);

  return agg.length > 0 && agg[0].avgLatency !== null ? agg[0].avgLatency : 0.0;
};

module.exports = {
  save,
  getLatestByProject,
  getByMonitor,
  getUptimePercentage,
  getAvgLatency,
  formatCheckResultSummary,
};
