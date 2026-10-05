const incidentService = require('../services/incidentService');
const projectService = require('../services/projectService');

const listAll = async (req, res, next) => {
  try {
    const result = await incidentService.getByUser(req.user._id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const listByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    await projectService.getEntityById(projectId, req.user._id);
    const result = await incidentService.getByProject(projectId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listAll,
  listByProject,
};
