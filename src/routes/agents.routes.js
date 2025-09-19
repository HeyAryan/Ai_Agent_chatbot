const express = require('express');
const { getAgents } = require('../controllers/agent.controller');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.get('/', getAgents);

module.exports = router;


