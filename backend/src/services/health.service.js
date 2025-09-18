const { getConnectionState } = require('../db/mongoose');

async function getHealthStatus() {
	const mongoState = getConnectionState();
	return {
		status: 'ok',
		uptimeSeconds: process.uptime(),
		timestamp: Date.now(),
		database: {
			name: 'mongodb',
			state: mongoState
		}
	};
}

module.exports = {
	getHealthStatus
};


