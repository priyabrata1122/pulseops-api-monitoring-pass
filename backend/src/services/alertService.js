const axios = require('axios');
const Alert = require('../models/Alert');
const Monitor = require('../models/Monitor');
const Project = require('../models/Project');

const formatAlertResponse = (alert, monitor) => {
  const m = monitor || alert.monitor;
  const monitorId = m ? (m._id ? m._id.toString() : m.toString()) : null;
  const monitorName = m && m.name ? m.name : '';

  return {
    id: alert._id.toString(),
    type: alert.type,
    status: alert.status,
    message: alert.message || '',
    webhookUrl: alert.webhookUrl || null,
    failureReason: alert.failureReason || null,
    createdAt: alert.createdAt,
    sentAt: alert.sentAt || null,
    monitorId,
    monitorName,
  };
};

const createInAppAlert = async (monitor, message) => {
  const alert = new Alert({
    monitor: monitor._id,
    type: 'IN_APP',
    message,
    status: 'SENT',
    sentAt: new Date(),
  });
  await alert.save();
};

const createMockEmailAlert = async (monitor, message) => {
  let userEmail = 'user@pulseops.dev';
  if (monitor.project && monitor.project.user && monitor.project.user.email) {
    userEmail = monitor.project.user.email;
  }

  const alert = new Alert({
    monitor: monitor._id,
    type: 'MOCK_EMAIL',
    message: `[MOCK EMAIL] To: ${userEmail} | ${message}`,
    status: 'SENT',
    sentAt: new Date(),
  });
  await alert.save();
  console.log(`[MOCK EMAIL] Alert for monitor ${monitor.name} — ${message}`);
};

const fireWebhookIfConfigured = async (monitor, message) => {
  const webhookUrl = null; // Future: fetch from alert config

  const alert = new Alert({
    monitor: monitor._id,
    type: 'WEBHOOK',
    message,
    webhookUrl,
    status: webhookUrl ? 'PENDING' : 'PENDING',
  });

  if (webhookUrl && webhookUrl.trim().length > 0) {
    try {
      await axios.post(
        webhookUrl,
        {
          monitor: monitor.name,
          message,
          timestamp: new Date().toISOString(),
        },
        { timeout: 5000 }
      );
      alert.status = 'SENT';
      alert.sentAt = new Date();
    } catch (err) {
      alert.status = 'FAILED';
      alert.failureReason = err.message;
      console.warn(`[Webhook] Delivery failed for monitor ${monitor.name}: ${err.message}`);
    }
  }

  await alert.save();
};

const fireAlerts = async (monitor, message) => {
  await createInAppAlert(monitor, message);
  await createMockEmailAlert(monitor, message);
  if (monitor.project) {
    await fireWebhookIfConfigured(monitor, message);
  }
};

const getByUser = async (userId, limit = 50) => {
  const projects = await Project.find({ user: userId }).select('_id');
  const projectIds = projects.map((p) => p._id);
  if (projectIds.length === 0) return [];

  const monitors = await Monitor.find({ project: { $in: projectIds } }).select('_id name');
  const monitorMap = new Map();
  monitors.forEach((m) => monitorMap.set(m._id.toString(), m));

  const monitorIds = monitors.map((m) => m._id);
  if (monitorIds.length === 0) return [];

  const alerts = await Alert.find({ monitor: { $in: monitorIds } })
    .sort({ createdAt: -1 })
    .limit(limit);

  return alerts.map((a) => formatAlertResponse(a, monitorMap.get(a.monitor.toString())));
};

const getByProject = async (projectId, limit = 50) => {
  const monitors = await Monitor.find({ project: projectId }).select('_id name');
  const monitorMap = new Map();
  monitors.forEach((m) => monitorMap.set(m._id.toString(), m));

  const monitorIds = monitors.map((m) => m._id);
  if (monitorIds.length === 0) return [];

  const alerts = await Alert.find({ monitor: { $in: monitorIds } })
    .sort({ createdAt: -1 })
    .limit(limit);

  return alerts.map((a) => formatAlertResponse(a, monitorMap.get(a.monitor.toString())));
};

module.exports = {
  fireAlerts,
  getByUser,
  getByProject,
  formatAlertResponse,
};
