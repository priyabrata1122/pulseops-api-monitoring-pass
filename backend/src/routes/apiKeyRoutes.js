const express = require('express');
const router = express.Router({ mergeParams: true });
const apiKeyController = require('../controllers/apiKeyController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', apiKeyController.create);
router.get('/', apiKeyController.list);
router.delete('/:keyId', apiKeyController.revoke);

module.exports = router;
