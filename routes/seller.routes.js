const express = require("express");
const { getSellerStats, getSellerOrders } = require("../controllers/seller.controller");
const router = express.Router();

router.get("/stats", getSellerStats);

router.get("/orders", getSellerOrders);

module.exports = router;