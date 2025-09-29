const express = require('express');
const router = express.Router();
const messagePackController = require('../controllers/messagePack.controller');
const auth = require('../middleware/auth');

// Public routes
router.get('/', messagePackController.getMessagePacks);
router.get('/:packId', messagePackController.getMessagePack);

// Protected routes (require authentication)
router.use(auth);

// User routes
router.post('/:packId/purchase', messagePackController.purchaseMessagePack);
router.post('/verify-purchase', messagePackController.verifyMessagePackPurchase);
router.get('/credits/:agentId', messagePackController.getUserMessageCredits);
router.get('/credits', messagePackController.getAllUserMessageCredits);

// Admin routes (require admin role)
router.post('/', auth, (req, res, next) => {
	if (req.user.role !== 'admin') {
		return res.status(403).json({
			success: false,
			message: 'Admin access required'
		});
	}
	next();
}, messagePackController.createMessagePack);

router.put('/:packId', auth, (req, res, next) => {
	if (req.user.role !== 'admin') {
		return res.status(403).json({
			success: false,
			message: 'Admin access required'
		});
	}
	next();
}, messagePackController.updateMessagePack);

router.delete('/:packId', auth, (req, res, next) => {
	if (req.user.role !== 'admin') {
		return res.status(403).json({
			success: false,
			message: 'Admin access required'
		});
	}
	next();
}, messagePackController.deleteMessagePack);

module.exports = router;
