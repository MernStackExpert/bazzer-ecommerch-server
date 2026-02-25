const express = require('express');
const { registerUser, verifyOTP } = require('../controllers/users.controller');
const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);

module.exports = router;