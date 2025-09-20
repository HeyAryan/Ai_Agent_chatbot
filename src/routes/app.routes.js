const express = require('express');
const { getAppConfig, getConnectionId } = require('../controllers/app.controller');

const router = express.Router();

router.get('/config', getAppConfig);
router.get('/get-connection-id', getConnectionId);

module.exports = router;


