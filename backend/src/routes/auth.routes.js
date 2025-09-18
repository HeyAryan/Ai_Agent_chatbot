const express = require('express');
const { postGoogleSignIn, postLogout } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/google', postGoogleSignIn);
router.post('/logout', postLogout);

module.exports = router;


