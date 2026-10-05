const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const ApiKey = require('../models/ApiKey');
const { ResourceNotFoundException, BadRequestException } = require('../middleware/errorHandler');

const create = async (name, project) => {
  const bytes = crypto.randomBytes(24);
  const rawKey = 'pk_' + bytes.toString('base64url');
  const prefix = rawKey.substring(0, 10);
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(rawKey, salt);

  const apiKey = new ApiKey({
    name: name.trim(),
    keyHash: hash,
    keyPrefix: prefix,
    project: project._id,
    active: true,
  });
  await apiKey.save();

  return {
    key: rawKey,
    prefix,
    name: apiKey.name,
  };
};

const listByProject = async (projectId) => {
  return await ApiKey.find({ project: projectId }).sort({ createdAt: -1 });
};

const revoke = async (keyId) => {
  const key = await ApiKey.findById(keyId);
  if (!key) {
    throw new ResourceNotFoundException('API key not found');
  }
  key.active = false;
  await key.save();
};

const validateKey = async (rawKey) => {
  if (!rawKey || typeof rawKey !== 'string') {
    throw new ResourceNotFoundException('Invalid API key');
  }
  const prefix = rawKey.substring(0, Math.min(10, rawKey.length));
  const apiKey = await ApiKey.findOne({ keyPrefix: prefix }).populate('project');

  if (!apiKey) {
    throw new ResourceNotFoundException('Invalid API key');
  }

  if (!apiKey.active) {
    throw new BadRequestException('API key is revoked');
  }

  const isMatch = await bcrypt.compare(rawKey, apiKey.keyHash);
  if (!isMatch) {
    throw new BadRequestException('Invalid API key');
  }

  return apiKey;
};

module.exports = {
  create,
  listByProject,
  revoke,
  validateKey,
};
