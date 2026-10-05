const Project = require('../models/Project');
const Monitor = require('../models/Monitor');
const Incident = require('../models/Incident');
const monitorService = require('./monitorService');
const checkResultService = require('./checkResultService');
const incidentService = require('./incidentService');
const alertService = require('./alertService');

const getDashboard = async (user) => {
  const projects = await Project.find({ user: user._id }).select('_id name');
  const projectIds = projects.map((p) => p._id);

  const monitorsDocs = await Monitor.find({ project: { $in: projectIds } }).populate('project');
  const monitors = monitorsDocs.map((m) => monitorService.formatMonitorResponse(m, m.project));

  const activeMonitors = monitors.filter((m) => m.active).length;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let uptime = 100.0;
  let totalLatency = 0.0;
  let openIncidents = 0;

  for (const pid of projectIds) {
    const u = await checkResultService.getUptimePercentage(pid, since);
    const l = await checkResultService.getAvgLatency(pid, since);
    uptime = Math.min(uptime, u);
    totalLatency += l;
    const openCount = await Incident.countDocuments({
      monitor: { $in: await Monitor.find({ project: pid }).select('_id') },
      status: 'OPEN',
    });
    openIncidents += openCount;
  }

  const avgLatencyMs = projectIds.length > 0 ? totalLatency / projectIds.length : 0.0;

  const recentChecks =
    projectIds.length === 0 ? [] : await checkResultService.getLatestByProject(projectIds[0], 20);

  const recentIncidentsAll = await incidentService.getByUser(user._id);
  const recentIncidents = recentIncidentsAll.slice(0, 5);

  const recentAlerts = await alertService.getByUser(user._id, 10);

  return {
    totalMonitors: monitors.length,
    activeMonitors,
    uptimePercentage: Math.round(uptime * 100.0) / 100.0,
    avgLatencyMs: Math.round(avgLatencyMs * 100.0) / 100.0,
    openIncidents,
    monitors,
    recentIncidents,
    recentAlerts,
    recentChecks,
  };
};

module.exports = {
  getDashboard,
};
