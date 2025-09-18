const { listAgents } = require('../services/agent.service');

async function getAgents(req, res, next) {
	try {
		const agents = await listAgents();
		return res.status(200).json({ success: true, data: agents });
	} catch (err) {
		return next(err);
	}
}

module.exports = {
	getAgents
};


