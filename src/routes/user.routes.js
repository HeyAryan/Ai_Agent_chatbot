const express = require('express');
const { auth } = require('../middleware/auth');
const { getMe, updateMe, updateSettings, deleteMe } = require('../controllers/user.controller');

const router = express.Router();

router.get('/me', auth, getMe);
router.put('/me', auth, updateMe);
router.put('/user/me/settings', (req, res) => res.status(410).json({ message: 'use /user/me/settings path from /user base' }));
router.put('/me/settings', auth, updateSettings);
router.delete('/me', auth, deleteMe);

module.exports = router;


