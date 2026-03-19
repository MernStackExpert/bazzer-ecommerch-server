const express = require("express");
const router = express.Router();
const { 
  saveAddress, 
  getAddressByEmail, 
  updateAddressByEmail, 
  deleteAddressByEmail, 
  getAllAddresses 
} = require("../controllers/address.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

router.post("/add", verifyToken, saveAddress);
router.get("/all", verifyToken, getAllAddresses);
router.get("/profile/:email", verifyToken, getAddressByEmail);
router.patch("/update/:email", verifyToken, updateAddressByEmail);
router.delete("/delete/:email", verifyToken, deleteAddressByEmail);

module.exports = router;