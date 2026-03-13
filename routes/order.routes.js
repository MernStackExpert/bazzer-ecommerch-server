const express = require("express");
const { createOrders, getOrders, getSingleOrder, updateOrder, deleteOrder } = require("../controllers/orders.controller");
const router = express.Router();


router.post("/create",  createOrders);

router.get("/my-orders",  getOrders);

router.get("/:id",  getSingleOrder);

router.patch("/update/:id",  updateOrder);

router.delete("/delete/:id",  deleteOrder);

module.exports = router;