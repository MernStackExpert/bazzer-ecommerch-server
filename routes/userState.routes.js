const express = require("express");
const router = express.Router();
const { getUserStats, getUserOrders } = require("../controllers/userStats.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

router.get("/stats", verifyToken, getUserStats);

router.get("/orders", verifyToken, getUserOrders);

module.exports = router;