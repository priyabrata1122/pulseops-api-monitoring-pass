const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'pulseops-super-secret-key-minimum-256-bits-long-for-hs256-algorithm';
};

const getJwtExpiration = () => {
  const exp = process.env.JWT_EXPIRATION;
  if (!exp) return '24h';
  if (/^\d+$/.test(exp)) {
    return Math.floor(parseInt(exp, 10) / 1000); // seconds
  }
  return exp;
};

const generateToken = (email, additionalPayload = {}) => {
  const secret = getJwtSecret();
  const expiresIn = getJwtExpiration();
  return jwt.sign(
    { sub: email, email, ...additionalPayload },
    secret,
    { expiresIn }
  );
};

const verifyToken = (token) => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
};

const extractEmail = (token) => {
  try {
    const decoded = verifyToken(token);
    return decoded.sub || decoded.email;
  } catch (err) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  extractEmail,
};
