const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slugRegex = /^[a-z0-9-]+$/;

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};
  const errors = {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (name.trim().length < 2 || name.trim().length > 80) {
    errors.name = 'Name must be between 2 and 80 characters';
  }

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(email.trim())) {
    errors.email = 'Must be a well-formed email address';
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.password = 'Password is required';
  } else if (password.length < 6 || password.length > 100) {
    errors.password = 'Password must be between 6 and 100 characters';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      status: 400,
      error: 'Validation Failed',
      errors,
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = {};

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(email.trim())) {
    errors.email = 'Must be a well-formed email address';
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      status: 400,
      error: 'Validation Failed',
      errors,
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

const validateCreateProject = (req, res, next) => {
  const { name, slug, description } = req.body || {};
  const errors = {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (name.trim().length < 2 || name.trim().length > 100) {
    errors.name = 'Name must be between 2 and 100 characters';
  }

  if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
    errors.slug = 'Slug is required';
  } else if (slug.trim().length < 2 || slug.trim().length > 60) {
    errors.slug = 'Slug must be between 2 and 60 characters';
  } else if (!slugRegex.test(slug.trim())) {
    errors.slug = 'Slug must be lowercase alphanumeric with hyphens';
  }

  if (description && typeof description === 'string' && description.length > 500) {
    errors.description = 'Description cannot exceed 500 characters';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      status: 400,
      error: 'Validation Failed',
      errors,
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

const validateCreateMonitor = (req, res, next) => {
  const { name, url, method, expectedStatusCode, intervalSeconds, timeoutSeconds } = req.body || {};
  const errors = {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (name.trim().length < 2 || name.trim().length > 100) {
    errors.name = 'Name must be between 2 and 100 characters';
  }

  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    errors.url = 'URL is required';
  } else if (url.trim().length > 500) {
    errors.url = 'URL cannot exceed 500 characters';
  }

  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'];
  if (method && !validMethods.includes(method.toUpperCase())) {
    errors.method = `Method must be one of: ${validMethods.join(', ')}`;
  }

  if (expectedStatusCode !== undefined && expectedStatusCode !== null) {
    const code = Number(expectedStatusCode);
    if (isNaN(code) || code < 100 || code > 599) {
      errors.expectedStatusCode = 'Expected status code must be between 100 and 599';
    }
  }

  if (intervalSeconds !== undefined && intervalSeconds !== null) {
    const interval = Number(intervalSeconds);
    if (isNaN(interval) || interval < 10 || interval > 3600) {
      errors.intervalSeconds = 'Interval must be between 10 and 3600 seconds';
    }
  }

  if (timeoutSeconds !== undefined && timeoutSeconds !== null) {
    const timeout = Number(timeoutSeconds);
    if (isNaN(timeout) || timeout < 1 || timeout > 60) {
      errors.timeoutSeconds = 'Timeout must be between 1 and 60 seconds';
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      status: 400,
      error: 'Validation Failed',
      errors,
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

const validateCreateEvent = (req, res, next) => {
  const { eventType, payload, apiKey } = req.body || {};
  const errors = {};

  if (!eventType || typeof eventType !== 'string' || eventType.trim().length === 0) {
    errors.eventType = 'Event type is required';
  } else if (eventType.trim().length > 100) {
    errors.eventType = 'Event type cannot exceed 100 characters';
  }

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    errors.apiKey = 'API key is required';
  }

  if (payload && typeof payload === 'string' && payload.length > 5000) {
    errors.payload = 'Payload cannot exceed 5000 characters';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      status: 400,
      error: 'Validation Failed',
      errors,
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateProject,
  validateCreateMonitor,
  validateCreateEvent,
};
