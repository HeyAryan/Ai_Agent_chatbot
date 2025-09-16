const express = require('express');
const { listFaq } = require('../controllers/faq.controller');

const router = express.Router();

router.get('/faq', listFaq);

module.exports = router;


