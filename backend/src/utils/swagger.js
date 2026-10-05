const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.1',
  info: {
    title: 'PulseOps Backend API',
    description: 'API Monitoring and Incident Alerting PaaS',
    version: '1.0.0',
  },
  servers: [
    {
      url: '/',
      description: 'Default Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/': {
      get: {
        summary: 'Root information endpoint',
        responses: { 200: { description: 'PulseOps status and endpoints' } },
      },
    },
    '/actuator/health': {
      get: {
        summary: 'Health probe',
        responses: { 200: { description: 'UP' } },
      },
    },
    '/actuator/prometheus': {
      get: {
        summary: 'Prometheus metrics',
        responses: { 200: { description: 'Metrics' } },
      },
    },
    '/api/v1/auth/register': {
      post: {
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
                required: ['name', 'email', 'password'],
              },
            },
          },
        },
        responses: { 201: { description: 'User registered' } },
      },
    },
    '/api/v1/auth/login': {
      post: {
        summary: 'Login and receive JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: { 200: { description: 'JWT Auth token' } },
      },
    },
    '/api/v1/dashboard': {
      get: {
        summary: 'Get dashboard overview',
        responses: { 200: { description: 'Dashboard metrics and recent items' } },
      },
    },
    '/api/v1/projects': {
      get: {
        summary: 'List all projects for current user',
        responses: { 200: { description: 'List of projects' } },
      },
      post: {
        summary: 'Create a new project',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  description: { type: 'string' },
                },
                required: ['name', 'slug'],
              },
            },
          },
        },
        responses: { 201: { description: 'Created project' } },
      },
    },
    '/api/v1/projects/{id}': {
      get: {
        summary: 'Get project by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Project details' } },
      },
      delete: {
        summary: 'Delete a project',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 204: { description: 'Deleted' } },
      },
    },
    '/api/v1/projects/{projectId}/monitors': {
      get: {
        summary: 'List monitors for a project',
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'List of monitors' } },
      },
      post: {
        summary: 'Create a monitor',
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  url: { type: 'string' },
                  method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'] },
                  expectedStatusCode: { type: 'integer' },
                  intervalSeconds: { type: 'integer' },
                  timeoutSeconds: { type: 'integer' },
                  active: { type: 'boolean' },
                },
                required: ['name', 'url'],
              },
            },
          },
        },
        responses: { 201: { description: 'Created monitor' } },
      },
    },
    '/api/v1/projects/{projectId}/monitors/{monitorId}': {
      get: {
        summary: 'Get a monitor by ID',
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'monitorId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Monitor details' } },
      },
      put: {
        summary: 'Update a monitor',
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'monitorId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Updated monitor' } },
      },
      delete: {
        summary: 'Delete a monitor',
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'monitorId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 204: { description: 'Deleted' } },
      },
    },
    '/api/v1/projects/{projectId}/monitors/{monitorId}/toggle': {
      patch: {
        summary: 'Toggle monitor active/inactive',
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'monitorId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Toggled monitor' } },
      },
    },
    '/api/v1/incidents': {
      get: {
        summary: 'List all incidents for current user',
        responses: { 200: { description: 'List of incidents' } },
      },
    },
    '/api/v1/projects/{projectId}/incidents': {
      get: {
        summary: 'List incidents for a project',
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'List of incidents' } },
      },
    },
    '/api/v1/alerts': {
      get: {
        summary: 'List all alerts for current user',
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } }],
        responses: { 200: { description: 'List of alerts' } },
      },
    },
    '/api/v1/projects/{projectId}/alerts': {
      get: {
        summary: 'List alerts for a project',
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: { 200: { description: 'List of alerts' } },
      },
    },
    '/api/v1/status/{slug}': {
      get: {
        summary: 'Public status page for a project (no auth required)',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Public status page' } },
      },
    },
    '/api/v1/projects/{projectId}/api-keys': {
      get: {
        summary: 'List API keys for a project',
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'List of API keys' } },
      },
      post: {
        summary: 'Create an API key',
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'name', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Created API key with raw token' } },
      },
    },
    '/api/v1/projects/{projectId}/api-keys/{keyId}': {
      delete: {
        summary: 'Revoke an API key',
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'keyId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 204: { description: 'Revoked' } },
      },
    },
    '/api/v1/events': {
      post: {
        summary: 'Submit a custom event using an API key',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  eventType: { type: 'string' },
                  payload: { type: 'string' },
                  apiKey: { type: 'string' },
                },
                required: ['eventType', 'apiKey'],
              },
            },
          },
        },
        responses: { 201: { description: 'Event accepted' } },
      },
    },
  },
};

module.exports = {
  swaggerUi,
  swaggerDocument,
};
