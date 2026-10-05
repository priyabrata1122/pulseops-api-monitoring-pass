const express = require('express');
const router = express.Router({ mergeParams: true });
const monitorController = require('../controllers/monitorController');
const { authenticate } = require('../middleware/auth');
const { validateCreateMonitor } = require('../validators/validators');

router.use(authenticate);

router.post('/', validateCreateMonitor, monitorController.create);
router.get('/', monitorController.list);
router.get('/:monitorId', monitorController.get);
router.put('/:monitorId', validateCreateMonitor, monitorController.update);
router.delete('/:monitorId', monitorController.delete);
router.patch('/:monitorId/toggle', monitorController.toggle);

module.exports = router;
