const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', alertController.listAll);

module.exports = router;
