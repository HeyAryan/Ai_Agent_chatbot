const express = require('express');
const healthRoutes = require('./health.routes');

const router = express.Router();

router.get('/', (req, res) => {
	return res.json({ message: 'AI Agent Chatbot API', version: 'v1' });
});

router.use('/health', healthRoutes);

module.exports = router;


