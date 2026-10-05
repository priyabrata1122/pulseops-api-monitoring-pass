const projectService = require('../services/projectService');

const create = async (req, res, next) => {
  try {
    const result = await projectService.create(req.body, req.user);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const result = await projectService.listByUser(req.user._id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const get = async (req, res, next) => {
  try {
    const result = await projectService.getById(req.params.id, req.user._id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    await projectService.delete(req.params.id, req.user._id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  list,
  get,
  delete: deleteProject,
};
