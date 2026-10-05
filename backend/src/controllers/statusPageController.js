const projectService = require('../services/projectService');
const monitorService = require('../services/monitorService');
const incidentService = require('../services/incidentService');

const getStatusPage = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const project = await projectService.getBySlug(slug);
    const monitors = await monitorService.listByProject(project._id);
    const incidents = await incidentService.getByProject(project._id);

    const openIncidents = incidents.filter((i) => i.status === 'OPEN').length;
    const overallStatus = openIncidents === 0 ? 'OPERATIONAL' : 'DEGRADED';

    res.status(200).json({
      project: {
        id: project._id.toString(),
        name: project.name,
        slug: project.slug,
      },
      status: overallStatus,
      monitors,
      openIncidents,
      recentIncidents: incidents.slice(0, 10),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStatusPage,
};
