const apiKeyService = require('../services/apiKeyService');
const rateLimiterService = require('../services/rateLimiterService');
const CustomEvent = require('../models/CustomEvent');

const submit = async (req, res, next) => {
  try {
    const { apiKey: rawKey, eventType, payload } = req.body;
    const prefix = rawKey.substring(0, Math.min(10, rawKey.length));

    const allowed = await rateLimiterService.isAllowed(prefix);
    if (!allowed) {
      return res.status(429).json({
        status: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded: 60 requests/minute',
        timestamp: new Date().toISOString(),
      });
    }

    const apiKey = await apiKeyService.validateKey(rawKey);

    const event = new CustomEvent({
      eventType,
      payload: payload || '',
      apiKey: apiKey._id,
      project: apiKey.project._id || apiKey.project,
    });
    await event.save();

    res.status(201).json({
      status: 'accepted',
      eventType,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submit,
};
