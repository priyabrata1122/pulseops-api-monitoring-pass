const express = require('express');
const router = express.Router();
const statusPageController = require('../controllers/statusPageController');

router.get('/:slug', statusPageController.getStatusPage);

module.exports = router;
