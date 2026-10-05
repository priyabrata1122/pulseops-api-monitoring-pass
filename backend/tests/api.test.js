const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Monitor = require('../src/models/Monitor');
const ApiKey = require('../src/models/ApiKey');

describe('PulseOps MERN Backend Integration Tests', () => {
  let authToken = null;
  let testUserId = null;
  let testProjectId = null;
  let testMonitorId = null;
  let testApiKey = null;
  const testProjectSlug = `test-project-${Date.now()}`;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const testMongoUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/pulseops_test';
    await connectDB(testMongoUri);
  });

  afterAll(async () => {
    // Clean up test database
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
    }
    await disconnectDB();
  });

  describe('Actuator & Home Endpoints', () => {
    it('GET / should return service information', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('PulseOps API Monitoring PaaS');
      expect(res.body.status).toBe('running');
      expect(res.body.health).toBe('/actuator/health');
    });

    it('GET /actuator/health should return UP status', async () => {
      const res = await request(app).get('/actuator/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
    });

    it('GET /actuator/prometheus should expose metrics', async () => {
      const res = await request(app).get('/actuator/prometheus');
      expect(res.status).toBe(200);
      expect(res.text).toContain('pulseops_monitor_checks_total');
    });

    it('GET /api-docs should return OpenAPI spec', async () => {
      const res = await request(app).get('/api-docs');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBeDefined();
    });
  });

  describe('Authentication Endpoints', () => {
    const testEmail = `tester-${Date.now()}@pulseops.dev`;

    it('POST /api/v1/auth/register should fail with invalid data', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: '', email: 'not-an-email', password: '123' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Failed');
      expect(res.body.errors).toBeDefined();
    });

    it('POST /api/v1/auth/register should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Integration Tester', email: testEmail, password: 'password123' });
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.email).toBe(testEmail);
      expect(res.body.userId).toBeDefined();
      authToken = res.body.token;
      testUserId = res.body.userId;
    });

    it('POST /api/v1/auth/register should prevent duplicate emails', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Integration Tester', email: testEmail, password: 'password123' });
      expect(res.status).toBe(400);
    });

    it('POST /api/v1/auth/login should fail with bad credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('POST /api/v1/auth/login should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      authToken = res.body.token;
    });
  });

  describe('Project & Monitor Lifecycle', () => {
    it('GET /api/v1/projects should return 401 if unauthenticated', async () => {
      const res = await request(app).get('/api/v1/projects');
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/projects should create a new project', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Integration Test Project',
          slug: testProjectSlug,
          description: 'A test project for integration tests',
        });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Integration Test Project');
      expect(res.body.slug).toBe(testProjectSlug);
      expect(res.body.id).toBeDefined();
      testProjectId = res.body.id;
    });

    it('GET /api/v1/projects should list user projects', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((p) => p.id === testProjectId)).toBe(true);
    });

    it('GET /api/v1/projects/:id should get project by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testProjectId);
    });

    it('POST /api/v1/projects/:projectId/monitors should create a monitor', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${testProjectId}/monitors`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test API Monitor',
          url: 'https://httpbin.org/status/200',
          method: 'GET',
          expectedStatusCode: 200,
          intervalSeconds: 60,
          timeoutSeconds: 10,
          active: true,
        });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Test API Monitor');
      expect(res.body.id).toBeDefined();
      testMonitorId = res.body.id;
    });

    it('GET /api/v1/projects/:projectId/monitors should list monitors', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${testProjectId}/monitors`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('PATCH /api/v1/projects/:projectId/monitors/:monitorId/toggle should toggle active', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${testProjectId}/monitors/${testMonitorId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.active).toBe(false);

      // Toggle back to true
      const res2 = await request(app)
        .patch(`/api/v1/projects/${testProjectId}/monitors/${testMonitorId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res2.status).toBe(200);
      expect(res2.body.active).toBe(true);
    });

    it('PUT /api/v1/projects/:projectId/monitors/:monitorId should update monitor', async () => {
      const res = await request(app)
        .put(`/api/v1/projects/${testProjectId}/monitors/${testMonitorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test API Monitor',
          url: 'https://httpbin.org/status/200',
          method: 'GET',
        });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Test API Monitor');
    });
  });

  describe('API Key & Custom Events', () => {
    it('POST /api/v1/projects/:projectId/api-keys should generate an API key', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${testProjectId}/api-keys?name=Production+Key`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.key).toMatch(/^pk_/);
      expect(res.body.prefix).toBeDefined();
      testApiKey = res.body.key;
    });

    it('GET /api/v1/projects/:projectId/api-keys should list project keys', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${testProjectId}/api-keys`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('POST /api/v1/events should accept events with valid API key', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send({
          apiKey: testApiKey,
          eventType: 'DEPLOYMENT_STARTED',
          payload: JSON.stringify({ version: '1.2.3' }),
        });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('accepted');
      expect(res.body.eventType).toBe('DEPLOYMENT_STARTED');
    });

    it('POST /api/v1/events should reject invalid API keys', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send({
          apiKey: 'pk_invalid_key_that_does_not_exist',
          eventType: 'DEPLOYMENT_STARTED',
        });
      expect(res.status).toBe(404);
    });
  });

  describe('Public Status Page & Dashboard', () => {
    it('GET /api/v1/status/:slug should return public status page without auth', async () => {
      const res = await request(app).get(`/api/v1/status/${testProjectSlug}`);
      expect(res.status).toBe(200);
      expect(res.body.project.slug).toBe(testProjectSlug);
      expect(res.body.status).toBe('OPERATIONAL');
      expect(res.body.monitors).toBeDefined();
    });

    it('GET /api/v1/dashboard should return dashboard statistics', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.totalMonitors).toBeGreaterThanOrEqual(1);
      expect(res.body.uptimePercentage).toBeDefined();
      expect(res.body.avgLatencyMs).toBeDefined();
    });

    it('GET /api/v1/incidents should list user incidents', async () => {
      const res = await request(app)
        .get('/api/v1/incidents')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/v1/alerts should list user alerts', async () => {
      const res = await request(app)
        .get('/api/v1/alerts')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Cleanup & Cascade Deletion', () => {
    it('DELETE /api/v1/projects/:projectId/monitors/:monitorId should delete monitor', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${testProjectId}/monitors/${testMonitorId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(204);
    });

    it('DELETE /api/v1/projects/:id should delete project and associated resources', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(204);

      // Verify project is gone
      const verifyRes = await request(app)
        .get(`/api/v1/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(verifyRes.status).toBe(404);
    });
  });
});
