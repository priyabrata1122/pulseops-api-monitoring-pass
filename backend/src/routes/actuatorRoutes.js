const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { getMetrics, getContentType } = require('../services/metricsService');

router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1; // 1 = connected

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'UP' : 'DOWN',
    components: {
      db: {
        status: isHealthy ? 'UP' : 'DOWN',
      },
    },
  });
});

router.get('/prometheus', async (req, res) => {
  try {
    res.set('Content-Type', getContentType());
    const metrics = await getMetrics();
    res.end(metrics);
  } catch (err) {
    res.status(500).end(err.message);
  }
});

module.exports = router;
