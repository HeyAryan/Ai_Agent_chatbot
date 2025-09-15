const dotenv = require('dotenv');
dotenv.config();

const config = Object.freeze({
	nodeEnv: process.env.NODE_ENV || 'development',
	port: Number(process.env.PORT || 3000),
	appName: process.env.APP_NAME || 'ai_agent_chatbot'
});

module.exports = config;


