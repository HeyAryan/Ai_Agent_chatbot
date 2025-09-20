async function getAppConfig(req, res) {
	return res.json({
		success: true,
		data: {
			themes: ['light', 'dark', 'system'],
			languages: ['en', 'es', 'fr'],
			fontSizes: ['sm', 'md', 'lg']
		}
	}
	);
}

async function getConnectionId(req, res) {
	try {
		const protocol = req.protocol;
		const host = req.get('host');
		const websocketUrl = `${protocol === 'https' ? 'wss' : 'ws'}://${host}`;
		
		console.log(`[APP] get-connection-id requested`, {
			ip: req.ip,
			userAgent: req.headers['user-agent'],
			websocketUrl
		});

		return res.json({
			success: true,
			data: {
				websocketUrl,
				connectionInfo: {
					protocol: protocol === 'https' ? 'wss' : 'ws',
					host,
					port: req.get('host').split(':')[1] || (protocol === 'https' ? '443' : '80'),
					timestamp: new Date().toISOString()
				},
				instructions: {
					authentication: 'Include JWT token in auth.token or Authorization header',
					events: [
						'notification:get → notification:receive',
						'connection:get → connection:receive', 
						'conversation:get → conversation:receive',
						'message:send → message:receive'
					]
				}
			}
		});
	} catch (error) {
		console.error(`[APP] Error in get-connection-id:`, error);
		return res.status(500).json({
			success: false,
			error: 'Failed to get connection information'
		});
	}
}

module.exports = { getAppConfig, getConnectionId };


