async function getHealthStatus() {
	return {
		status: 'ok',
		uptimeSeconds: process.uptime(),
		timestamp: Date.now()
	};
}

module.exports = {
	getHealthStatus
};


