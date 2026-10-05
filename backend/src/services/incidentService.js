const Incident = require('../models/Incident');
const Monitor = require('../models/Monitor');
const Project = require('../models/Project');

const formatIncidentResponse = (incident, monitor) => {
  const m = monitor || incident.monitor;
  const monitorId = m ? (m._id ? m._id.toString() : m.toString()) : null;
  const monitorName = m && m.name ? m.name : '';
  const monitorUrl = m && m.url ? m.url : '';
  const projectId = m && m.project ? (m.project._id ? m.project._id.toString() : m.project.toString()) : null;

  return {
    id: incident._id.toString(),
    status: incident.status,
    reason: incident.reason || '',
    startedAt: incident.startedAt,
    resolvedAt: incident.resolvedAt || null,
    failureCount: incident.failureCount || 1,
    monitorId,
    monitorName,
    monitorUrl,
    projectId,
  };
};

const openOrUpdate = async (monitor, reason) => {
  const existing = await Incident.findOne({ monitor: monitor._id, status: 'OPEN' });
  if (existing) {
    existing.failureCount = (existing.failureCount || 1) + 1;
    existing.reason = reason;
    return await existing.save();
  }

  const incident = new Incident({
    monitor: monitor._id,
    status: 'OPEN',
    reason,
    failureCount: 1,
    startedAt: new Date(),
  });
  return await incident.save();
};

const resolveIfOpen = async (monitor) => {
  const incident = await Incident.findOne({ monitor: monitor._id, status: 'OPEN' });
  if (incident) {
    incident.status = 'RESOLVED';
    incident.resolvedAt = new Date();
    await incident.save();
    return incident;
  }
  return null;
};

const getByProject = async (projectId) => {
  const monitors = await Monitor.find({ project: projectId }).select('_id name url project');
  const monitorMap = new Map();
  monitors.forEach((m) => monitorMap.set(m._id.toString(), m));

  const monitorIds = monitors.map((m) => m._id);
  if (monitorIds.length === 0) return [];

  const incidents = await Incident.find({ monitor: { $in: monitorIds } }).sort({ startedAt: -1 });
  return incidents.map((i) => formatIncidentResponse(i, monitorMap.get(i.monitor.toString())));
};

const getByUser = async (userId) => {
  const projects = await Project.find({ user: userId }).select('_id');
  const projectIds = projects.map((p) => p._id);
  if (projectIds.length === 0) return [];

  const monitors = await Monitor.find({ project: { $in: projectIds } }).select('_id name url project');
  const monitorMap = new Map();
  monitors.forEach((m) => monitorMap.set(m._id.toString(), m));

  const monitorIds = monitors.map((m) => m._id);
  if (monitorIds.length === 0) return [];

  const incidents = await Incident.find({ monitor: { $in: monitorIds } }).sort({ startedAt: -1 });
  return incidents.map((i) => formatIncidentResponse(i, monitorMap.get(i.monitor.toString())));
};

const hasOpenIncident = async (monitorId) => {
  const count = await Incident.countDocuments({ monitor: monitorId, status: 'OPEN' });
  return count > 0;
};

module.exports = {
  openOrUpdate,
  resolveIfOpen,
  getByProject,
  getByUser,
  hasOpenIncident,
  formatIncidentResponse,
};
