const express = require("express");
const { getSellerStats, getSellerOrders, getSellerProductsList } = require("../controllers/seller.controller");
const router = express.Router();

router.get("/stats", getSellerStats);

router.get("/orders", getSellerOrders);

router.get("/products",  getSellerProductsList);

module.exports = router;