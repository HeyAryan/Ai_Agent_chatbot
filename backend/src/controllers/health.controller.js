const healthService = require('../services/health.service');

async function getHealthStatus(req, res, next) {
	try {
		const payload = await healthService.getHealthStatus();
		return res.json(payload);
	} catch (error) {
		return next(error);
	}
}

module.exports = {
	getHealthStatus
};


