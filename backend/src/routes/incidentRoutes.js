const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', incidentController.listAll);

module.exports = router;
