const getHome = (req, res) => {
  res.status(200).json({
    service: 'PulseOps API Monitoring PaaS',
    status: 'running',
    health: '/actuator/health',
    swagger: '/swagger-ui.html',
    apiDocs: '/api-docs',
  });
};

module.exports = {
  getHome,
};
