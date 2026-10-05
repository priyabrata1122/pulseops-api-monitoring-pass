const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { validateCreateEvent } = require('../validators/validators');

router.post('/', validateCreateEvent, eventController.submit);

module.exports = router;
