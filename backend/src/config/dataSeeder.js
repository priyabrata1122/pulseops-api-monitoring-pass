const User = require('../models/User');
const Project = require('../models/Project');
const Monitor = require('../models/Monitor');
const CheckResult = require('../models/CheckResult');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');

const seedDemoData = async () => {
  try {
    const existing = await User.findOne({ email: 'demo@pulseops.dev' });
    if (existing) {
      console.log('[DataSeeder] Demo data already seeded — skipping');
      return;
    }

    console.log('[DataSeeder] Seeding demo data...');

    const demoUser = new User({
      name: 'Demo User',
      email: 'demo@pulseops.dev',
      password: 'demo123', // Will be hashed by userSchema pre('save') hook
    });
    await demoUser.save();

    const project = new Project({
      name: 'My SaaS App',
      slug: 'my-saas-app',
      description: 'Production monitoring for my SaaS platform',
      user: demoUser._id,
    });
    await project.save();

    const now = Date.now();

    const apiMonitor = new Monitor({
      name: 'API Health',
      url: 'https://httpbin.org/status/200',
      method: 'GET',
      expectedStatusCode: 200,
      intervalSeconds: 60,
      timeoutSeconds: 10,
      active: true,
      project: project._id,
      lastCheckedAt: new Date(now - 60 * 1000),
    });
    await apiMonitor.save();

    const webMonitor = new Monitor({
      name: 'Website Homepage',
      url: 'https://example.com',
      method: 'GET',
      expectedStatusCode: 200,
      intervalSeconds: 120,
      timeoutSeconds: 15,
      active: true,
      project: project._id,
      lastCheckedAt: new Date(now - 120 * 1000),
    });
    await webMonitor.save();

    const authMonitor = new Monitor({
      name: 'Auth Service',
      url: 'https://httpbin.org/status/200',
      method: 'GET',
      expectedStatusCode: 200,
      intervalSeconds: 30,
      timeoutSeconds: 5,
      active: true,
      project: project._id,
      lastCheckedAt: new Date(now - 30 * 1000),
    });
    await authMonitor.save();

    // Historical checks for apiMonitor
    const checkResults = [];
    for (let i = 48; i >= 0; i--) {
      const time = new Date(now - i * 30 * 60 * 1000);
      const success = i !== 5 && i !== 6;
      checkResults.push({
        monitor: apiMonitor._id,
        statusCode: success ? 200 : 503,
        latencyMs: success ? Math.floor(80 + Math.random() * 120) : null,
        success,
        errorMessage: success ? null : 'Service Unavailable',
        checkedAt: time,
      });
    }

    // Historical checks for webMonitor
    for (let i = 24; i >= 0; i--) {
      const time = new Date(now - i * 60 * 60 * 1000);
      checkResults.push({
        monitor: webMonitor._id,
        statusCode: 200,
        latencyMs: Math.floor(200 + Math.random() * 300),
        success: true,
        checkedAt: time,
      });
    }

    await CheckResult.insertMany(checkResults);

    // Seed a resolved incident
    const incident = new Incident({
      monitor: apiMonitor._id,
      status: 'RESOLVED',
      reason: 'Service Unavailable — HTTP 503',
      failureCount: 2,
      startedAt: new Date(now - 5 * 60 * 60 * 1000),
      resolvedAt: new Date(now - 4 * 60 * 60 * 1000),
    });
    await incident.save();

    // Seed alerts
    await Alert.insertMany([
      {
        monitor: apiMonitor._id,
        type: 'IN_APP',
        status: 'SENT',
        message: "Monitor 'API Health' is DOWN: Service Unavailable",
        sentAt: new Date(now - 5 * 60 * 60 * 1000),
        createdAt: new Date(now - 5 * 60 * 60 * 1000),
      },
      {
        monitor: apiMonitor._id,
        type: 'MOCK_EMAIL',
        status: 'SENT',
        message: "[MOCK EMAIL] To: demo@pulseops.dev | Monitor 'API Health' has RECOVERED",
        sentAt: new Date(now - 4 * 60 * 60 * 1000),
        createdAt: new Date(now - 4 * 60 * 60 * 1000),
      },
    ]);

    console.log('[DataSeeder] Demo data seeded. Login: demo@pulseops.dev / demo123');
  } catch (err) {
    console.error(`[DataSeeder] Seeding error: ${err.message}`);
  }
};

module.exports = { seedDemoData };
