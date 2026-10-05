const monitorService = require('../services/monitorService');
const projectService = require('../services/projectService');

const create = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await projectService.getEntityById(projectId, req.user._id);
    const result = await monitorService.create(req.body, project);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    await projectService.getEntityById(projectId, req.user._id);
    const result = await monitorService.listByProject(projectId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const get = async (req, res, next) => {
  try {
    const { projectId, monitorId } = req.params;
    await projectService.getEntityById(projectId, req.user._id);
    const result = await monitorService.getById(monitorId, projectId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { projectId, monitorId } = req.params;
    await projectService.getEntityById(projectId, req.user._id);
    const result = await monitorService.update(monitorId, projectId, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const deleteMonitor = async (req, res, next) => {
  try {
    const { projectId, monitorId } = req.params;
    await projectService.getEntityById(projectId, req.user._id);
    await monitorService.delete(monitorId, projectId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const toggle = async (req, res, next) => {
  try {
    const { projectId, monitorId } = req.params;
    await projectService.getEntityById(projectId, req.user._id);
    const result = await monitorService.toggleActive(monitorId, projectId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  list,
  get,
  update,
  delete: deleteMonitor,
  toggle,
};
