const dotenv = require('dotenv');
dotenv.config();

const config = Object.freeze({
	nodeEnv: process.env.NODE_ENV || 'development',
	port: Number(process.env.PORT || 3000),
	appName: process.env.APP_NAME || 'ai_agent_chatbot',
	app: {
		baseUrl: process.env.APP_BASE_URL || 'http://localhost:3000'
	},
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
	},
	razorpay: {
		keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_LulbryWU8UwbB4',
		keySecret: process.env.RAZORPAY_KEY_SECRET || 'OJ51AJqfCsch2As73tXguJSZ'
	}
});

module.exports = config;


