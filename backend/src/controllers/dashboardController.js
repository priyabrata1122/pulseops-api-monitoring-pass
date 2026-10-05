const dashboardService = require('../services/dashboardService');

const getDashboard = async (req, res, next) => {
  try {
    const result = await dashboardService.getDashboard(req.user);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
};
