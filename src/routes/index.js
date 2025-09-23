const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const agentsRoutes = require('./agents.routes');
const assistantsRoutes = require('./assistants.routes');
const assistantRoutes = require('./assistant.routes');
const chatsRoutes = require('./chats.routes');
const notificationsRoutes = require('./notifications.routes');
const subscriptionRoutes = require('./subscription.routes');
const paymentRoutes = require('./payment.routes');
const appRoutes = require('./app.routes');
const faqRoutes = require('./faq.routes');
const userRoutes = require('./user.routes');
const supportRoutes = require('./support.routes');

const router = express.Router();

router.get('/', (req, res) => {
	return res.json({ message: 'AI Agent Chatbot API', version: 'v1' });
});

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/agents', agentsRoutes);
router.use('/assistants', assistantsRoutes);
router.use('/chats', chatsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/payments', paymentRoutes);
router.use('/app', appRoutes);
router.use('/faq', faqRoutes);
router.use('/user', userRoutes);
router.use('/support', supportRoutes);

module.exports = router;


