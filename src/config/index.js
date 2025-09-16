const dotenv = require('dotenv');
dotenv.config();

const config = Object.freeze({
	nodeEnv: process.env.NODE_ENV || 'development',
	port: Number(process.env.PORT || 3000),
	appName: process.env.APP_NAME || 'ai_agent_chatbot',
	mongo: {
		uri: process.env.MONGO_URI || '',
		maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10)
	},
	jwt: {
		secret: process.env.JWT_SECRET || 'dev-secret',
		expiresIn: process.env.JWT_EXPIRES_IN || '7d'
	},
	google: {
		clientId: process.env.GOOGLE_CLIENT_ID || ''
	}
});

module.exports = config;


