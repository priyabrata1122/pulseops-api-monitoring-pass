const alertService = require('../services/alertService');
const projectService = require('../services/projectService');

const listAll = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const result = await alertService.getByUser(req.user._id, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const listByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit || '50', 10);
    await projectService.getEntityById(projectId, req.user._id);
    const result = await alertService.getByProject(projectId, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listAll,
  listByProject,
};
