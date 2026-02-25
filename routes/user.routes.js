const express = require('express');
const { registerUser, verifyOTP } = require('../controllers/users.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginUser);
router.post('/verify-login-otp', verifyLoginOTP);

router.put('/update-profile', verifyToken, updateProfile);
router.put('/update-password', verifyToken, updatePassword);

module.exports = router;
