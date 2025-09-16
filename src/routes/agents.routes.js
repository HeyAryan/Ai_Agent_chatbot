const express = require('express');
const { getAgents } = require('../controllers/agent.controller');

const router = express.Router();

router.get('/', getAgents);

module.exports = router;


