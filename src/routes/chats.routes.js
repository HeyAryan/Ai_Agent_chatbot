const express = require('express');
const { auth } = require('../middleware/auth');
const { listChats, getChat, createChat, postMessage, pinChat, deleteChat } = require('../controllers/chats.controller');

const router = express.Router();

router.get('/', auth, listChats);
router.get('/:id', auth, getChat);
router.post('/', auth, createChat);
router.post('/:id/message', auth, postMessage);
router.post('/:id/pin', auth, pinChat);
router.delete('/:id', auth, deleteChat);

module.exports = router;


