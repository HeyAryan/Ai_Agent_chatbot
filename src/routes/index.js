const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const agentsRoutes = require('./agents.routes');

const router = express.Router();

router.get('/', (req, res) => {
	return res.json({ message: 'AI Agent Chatbot API', version: 'v1' });
});

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/agents', agentsRoutes);

module.exports = router;


