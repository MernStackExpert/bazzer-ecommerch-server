const express = require('express');
const { addToWishlist, getMyWishlist, removeFromWishlist } = require('../controllers/wishlist.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const router = express.Router();

router.post('/add', verifyToken, addToWishlist);
router.get('/my-wishlist', verifyToken, getMyWishlist);
router.delete('/remove/:id', verifyToken, removeFromWishlist);

module.exports = router;