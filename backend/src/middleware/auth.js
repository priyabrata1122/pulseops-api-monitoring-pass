const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 401,
      error: 'Unauthorized',
      message: 'Full authentication is required to access this resource',
      timestamp: new Date().toISOString(),
    });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = verifyToken(token);
    const email = decoded.sub || decoded.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        status: 401,
        error: 'Unauthorized',
        message: 'User no longer exists',
        timestamp: new Date().toISOString(),
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      status: 401,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = { authenticate };
