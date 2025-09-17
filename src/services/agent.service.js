const { Agent } = require('../models');

async function listAgents() {
	const agents = await Agent.find({ status: "active" })
		.sort({ createdAt: -1 })
		.lean()
		.exec();
	return agents;
}

module.exports = {
	listAgents
};