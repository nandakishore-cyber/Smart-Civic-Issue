const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, logoutUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

// GET /api/auth/me
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutUser);

module.exports = router;
