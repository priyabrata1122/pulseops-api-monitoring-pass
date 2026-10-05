const express = require('express');
const router = express.Router();

const { getHome } = require('../controllers/homeController');
const authRoutes = require('./authRoutes');
const projectRoutes = require('./projectRoutes');
const incidentRoutes = require('./incidentRoutes');
const alertRoutes = require('./alertRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const statusPageRoutes = require('./statusPageRoutes');
const eventRoutes = require('./eventRoutes');
const actuatorRoutes = require('./actuatorRoutes');
const { swaggerUi, swaggerDocument } = require('../utils/swagger');

// Root home info endpoint
router.get('/', getHome);

// Actuator endpoints (Health & Prometheus)
router.use('/actuator', actuatorRoutes);

// Swagger / OpenAPI documentation
router.get('/api-docs', (req, res) => res.json(swaggerDocument));
router.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
router.get('/swagger-ui.html', (req, res) => res.redirect('/swagger-ui'));

// API v1 endpoints
const apiV1 = express.Router();
apiV1.use('/auth', authRoutes);
apiV1.use('/projects', projectRoutes);
apiV1.use('/incidents', incidentRoutes);
apiV1.use('/alerts', alertRoutes);
apiV1.use('/dashboard', dashboardRoutes);
apiV1.use('/status', statusPageRoutes);
apiV1.use('/events', eventRoutes);

router.use('/api/v1', apiV1);

module.exports = router;
