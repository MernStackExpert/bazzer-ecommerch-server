const express = require("express");
const router = express.Router();
const { 
  addToCart, 
  getMyCart, 
  updateCartQuantity, 
  removeFromCart 
} = require("../controllers/cart.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

router.post("/add", verifyToken, addToCart);

router.get("/my-cart", verifyToken, getMyCart);

router.patch("/update/:id", verifyToken, updateCartQuantity);

router.delete("/remove/:id", verifyToken, removeFromCart);

module.exports = router;