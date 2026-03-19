const express = require("express");
const router = express.Router();
const { 
  applyForSeller, 
  getSellerByEmail, 
  updateSellerProfile, 
  deleteSellerAccount, 
  getAllSellers 
} = require("../controllers/sellerAuth.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

router.post("/apply", verifyToken, applyForSeller);
router.get("/all", getAllSellers);
router.get("/profile/:email", getSellerByEmail);
router.patch("/update", verifyToken, updateSellerProfile);
router.delete("/remove/:id", verifyToken, deleteSellerAccount);

module.exports = router;