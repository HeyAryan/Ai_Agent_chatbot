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

module.exports = { getAppConfig };


