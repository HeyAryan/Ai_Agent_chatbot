const express = require('express');
const { auth } = require('../middleware/auth');
const { getPricing, subscribe, cancel, status } = require('../controllers/subscription.controller');

const router = express.Router();

router.get('/pricing', getPricing);
router.post('/subscribe', auth, subscribe);
router.post('/cancel', auth, cancel);
router.get('/status', auth, status);

module.exports = router;


