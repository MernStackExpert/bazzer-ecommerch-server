const express = require("express");
const router = express.Router();
const { getAdminStats, getAllOrdersAdmin } = require("../controllers/admin.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Access denied! Admin only." });
  }
  next();
};

router.get("/stats", verifyToken, verifyAdmin, getAdminStats);
router.get("/all-orders", verifyToken, verifyAdmin, getAllOrdersAdmin);

module.exports = router;