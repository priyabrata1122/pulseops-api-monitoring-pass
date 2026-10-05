const Project = require('../models/Project');
const Monitor = require('../models/Monitor');
const CheckResult = require('../models/CheckResult');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const ApiKey = require('../models/ApiKey');
const CustomEvent = require('../models/CustomEvent');
const { ResourceNotFoundException, BadRequestException } = require('../middleware/errorHandler');

const formatProjectResponse = async (project) => {
  const monitorCount = await Monitor.countDocuments({ project: project._id });
  return {
    id: project._id.toString(),
    name: project.name,
    slug: project.slug,
    description: project.description || '',
    createdAt: project.createdAt,
    monitorCount,
  };
};

const create = async (request, user) => {
  const existing = await Project.findOne({ slug: request.slug.toLowerCase().trim() });
  if (existing) {
    throw new BadRequestException(`Project slug already taken: ${request.slug}`);
  }

  const project = new Project({
    name: request.name.trim(),
    slug: request.slug.toLowerCase().trim(),
    description: request.description ? request.description.trim() : '',
    user: user._id,
  });
  await project.save();

  return formatProjectResponse(project);
};

const listByUser = async (userId) => {
  const projects = await Project.find({ user: userId }).sort({ createdAt: -1 });
  return Promise.all(projects.map(formatProjectResponse));
};

const getById = async (projectId, userId) => {
  const project = await Project.findOne({ _id: projectId, user: userId });
  if (!project) {
    throw new ResourceNotFoundException(`Project not found: ${projectId}`);
  }
  return formatProjectResponse(project);
};

const getEntityById = async (projectId, userId) => {
  const query = { _id: projectId };
  if (userId) query.user = userId;
  const project = await Project.findOne(query);
  if (!project) {
    throw new ResourceNotFoundException(`Project not found: ${projectId}`);
  }
  return project;
};

const deleteProject = async (projectId, userId) => {
  const project = await Project.findOne({ _id: projectId, user: userId });
  if (!project) {
    throw new ResourceNotFoundException(`Project not found: ${projectId}`);
  }

  // Cascade delete monitors and their associated data
  const monitors = await Monitor.find({ project: project._id });
  const monitorIds = monitors.map((m) => m._id);

  if (monitorIds.length > 0) {
    await CheckResult.deleteMany({ monitor: { $in: monitorIds } });
    await Incident.deleteMany({ monitor: { $in: monitorIds } });
    await Alert.deleteMany({ monitor: { $in: monitorIds } });
    await Monitor.deleteMany({ _id: { $in: monitorIds } });
  }

  // Delete api keys and custom events
  await ApiKey.deleteMany({ project: project._id });
  await CustomEvent.deleteMany({ project: project._id });

  await Project.findByIdAndDelete(project._id);
};

const getBySlug = async (slug) => {
  const project = await Project.findOne({ slug: slug.toLowerCase().trim() });
  if (!project) {
    throw new ResourceNotFoundException(`Project not found: ${slug}`);
  }
  return project;
};

module.exports = {
  create,
  listByUser,
  getById,
  getEntityById,
  delete: deleteProject,
  getBySlug,
  formatProjectResponse,
};
