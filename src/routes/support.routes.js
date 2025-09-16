const express = require('express');
const { auth } = require('../middleware/auth');
const { createTicket, getTicket } = require('../controllers/support.controller');

const router = express.Router();

router.post('/ticket', auth, createTicket);
router.get('/ticket/:id', auth, getTicket);
router.post('/contact', auth, (req, res) => res.json({ success: true }));

module.exports = router;


