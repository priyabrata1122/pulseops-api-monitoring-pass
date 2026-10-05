const Monitor = require('../models/Monitor');
const Project = require('../models/Project');
const CheckResult = require('../models/CheckResult');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const { ResourceNotFoundException } = require('../middleware/errorHandler');

const formatMonitorResponse = (monitor, project) => {
  const proj = project || monitor.project;
  const projectId = proj ? (proj._id ? proj._id.toString() : proj.toString()) : null;
  const projectName = proj && proj.name ? proj.name : '';

  return {
    id: monitor._id.toString(),
    name: monitor.name,
    url: monitor.url,
    method: monitor.method || 'GET',
    expectedStatusCode: monitor.expectedStatusCode || 200,
    intervalSeconds: monitor.intervalSeconds || 60,
    timeoutSeconds: monitor.timeoutSeconds || 10,
    active: monitor.active !== undefined ? monitor.active : true,
    lastCheckedAt: monitor.lastCheckedAt || null,
    createdAt: monitor.createdAt,
    projectId,
    projectName,
  };
};

const create = async (request, project) => {
  const monitor = new Monitor({
    name: request.name.trim(),
    url: request.url.trim(),
    method: request.method || 'GET',
    expectedStatusCode: request.expectedStatusCode !== undefined ? request.expectedStatusCode : 200,
    intervalSeconds: request.intervalSeconds !== undefined ? request.intervalSeconds : 60,
    timeoutSeconds: request.timeoutSeconds !== undefined ? request.timeoutSeconds : 10,
    active: request.active !== undefined ? request.active : true,
    project: project._id,
  });
  await monitor.save();
  return formatMonitorResponse(monitor, project);
};

const listByProject = async (projectId) => {
  const project = await Project.findById(projectId);
  const monitors = await Monitor.find({ project: projectId }).populate('project');
  return monitors.map((m) => formatMonitorResponse(m, m.project || project));
};

const getById = async (monitorId, projectId) => {
  const monitor = await Monitor.findOne({ _id: monitorId, project: projectId }).populate('project');
  if (!monitor) {
    throw new ResourceNotFoundException(`Monitor not found: ${monitorId}`);
  }
  return formatMonitorResponse(monitor, monitor.project);
};

const getEntityById = async (monitorId) => {
  const monitor = await Monitor.findById(monitorId).populate({
    path: 'project',
    populate: { path: 'user' },
  });
  if (!monitor) {
    throw new ResourceNotFoundException(`Monitor not found: ${monitorId}`);
  }
  return monitor;
};

const update = async (monitorId, projectId, request) => {
  const monitor = await Monitor.findOne({ _id: monitorId, project: projectId }).populate('project');
  if (!monitor) {
    throw new ResourceNotFoundException(`Monitor not found: ${monitorId}`);
  }

  if (request.name !== undefined) monitor.name = request.name.trim();
  if (request.url !== undefined) monitor.url = request.url.trim();
  if (request.method !== undefined) monitor.method = request.method;
  if (request.expectedStatusCode !== undefined) monitor.expectedStatusCode = request.expectedStatusCode;
  if (request.intervalSeconds !== undefined) monitor.intervalSeconds = request.intervalSeconds;
  if (request.timeoutSeconds !== undefined) monitor.timeoutSeconds = request.timeoutSeconds;
  if (request.active !== undefined) monitor.active = request.active;

  await monitor.save();
  return formatMonitorResponse(monitor, monitor.project);
};

const deleteMonitor = async (monitorId, projectId) => {
  const monitor = await Monitor.findOne({ _id: monitorId, project: projectId });
  if (!monitor) {
    throw new ResourceNotFoundException(`Monitor not found: ${monitorId}`);
  }

  await CheckResult.deleteMany({ monitor: monitor._id });
  await Incident.deleteMany({ monitor: monitor._id });
  await Alert.deleteMany({ monitor: monitor._id });
  await Monitor.findByIdAndDelete(monitor._id);
};

const updateLastCheckedAt = async (monitorId) => {
  await Monitor.findByIdAndUpdate(monitorId, { lastCheckedAt: new Date() });
};

const toggleActive = async (monitorId, projectId) => {
  const monitor = await Monitor.findOne({ _id: monitorId, project: projectId }).populate('project');
  if (!monitor) {
    throw new ResourceNotFoundException(`Monitor not found: ${monitorId}`);
  }

  monitor.active = !monitor.active;
  await monitor.save();
  return formatMonitorResponse(monitor, monitor.project);
};

module.exports = {
  create,
  listByProject,
  getById,
  getEntityById,
  update,
  delete: deleteMonitor,
  updateLastCheckedAt,
  toggleActive,
  formatMonitorResponse,
};
