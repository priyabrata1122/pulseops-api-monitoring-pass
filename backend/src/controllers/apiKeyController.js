const apiKeyService = require('../services/apiKeyService');
const projectService = require('../services/projectService');
const { BadRequestException } = require('../middleware/errorHandler');

const create = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const name = req.query.name || req.body?.name;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new BadRequestException('Query parameter "name" is required');
    }

    const project = await projectService.getEntityById(projectId, req.user._id);
    const result = await apiKeyService.create(name, project);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    await projectService.getEntityById(projectId, req.user._id);
    const keys = await apiKeyService.listByProject(projectId);
    const formatted = keys.map((k) => ({
      id: k._id.toString(),
      name: k.name,
      prefix: k.keyPrefix,
      active: k.active,
      createdAt: k.createdAt,
    }));
    res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
};

const revoke = async (req, res, next) => {
  try {
    const { projectId, keyId } = req.params;
    await projectService.getEntityById(projectId, req.user._id);
    await apiKeyService.revoke(keyId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  list,
  revoke,
};
