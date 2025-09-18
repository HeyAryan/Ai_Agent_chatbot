const express = require('express');
const { auth } = require('../middleware/auth');
const { listNotifications, markRead, deleteNotification } = require('../controllers/notifications.controller');

const router = express.Router();

router.get('/', auth, listNotifications);
router.put('/:id/read', auth, markRead);
router.delete('/:id', auth, deleteNotification);

module.exports = router;


