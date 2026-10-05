const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const incidentController = require('../controllers/incidentController');
const alertController = require('../controllers/alertController');
const monitorRoutes = require('./monitorRoutes');
const apiKeyRoutes = require('./apiKeyRoutes');
const { authenticate } = require('../middleware/auth');
const { validateCreateProject } = require('../validators/validators');

router.use(authenticate);

// Nested routes
router.use('/:projectId/monitors', monitorRoutes);
router.use('/:projectId/api-keys', apiKeyRoutes);
router.get('/:projectId/incidents', incidentController.listByProject);
router.get('/:projectId/alerts', alertController.listByProject);

// Project CRUD
router.post('/', validateCreateProject, projectController.create);
router.get('/', projectController.list);
router.get('/:id', projectController.get);
router.delete('/:id', projectController.delete);

module.exports = router;
