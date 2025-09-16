const express = require('express');
const { postGoogleSignIn } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/google', postGoogleSignIn);

module.exports = router;


