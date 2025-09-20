const express = require('express');
const { postGoogleSignIn, postLogout, getUserDetailsFromSession } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/google', postGoogleSignIn);
router.post('/logout', postLogout);
router.get('/user', getUserDetailsFromSession);

module.exports = router;


