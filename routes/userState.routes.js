const express = require("express");
const router = express.Router();
const { getUserStats, getUserOrders } = require("../controllers/userStats.controller");

router.get("/stats",  getUserStats);

router.get("/orders",  getUserOrders);

module.exports = router;