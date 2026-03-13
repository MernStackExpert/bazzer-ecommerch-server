const { connectDB, ObjectId } = require("../config/db");

const getSellerStats = async (req, res) => {
  try {
    const db = await connectDB();
    const ordersCollection = db.collection("bazzar_orders");
    const sellerId = req.user.id; 

    const stats = await ordersCollection.aggregate([
      { $unwind: "$products" },
      { $match: { "products.sellerId": new ObjectId(sellerId) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "pending"] }, 1, 0] }
          },
          successfulSales: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0] }
          },
          totalEarnings: {
            $sum: { $multiply: ["$products.price", "$products.quantity"] }
          }
        }
      }
    ]).toArray();

    res.status(200).json({
      success: true,
      data: stats.length > 0 ? stats[0] : { 
        totalOrders: 0, 
        pendingOrders: 0, 
        successfulSales: 0, 
        totalEarnings: 0 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSellerOrders = async (req, res) => {
  try {
    const db = await connectDB();
    const ordersCollection = db.collection("bazzar_orders");
    const sellerId = req.user.id;

    const orders = await ordersCollection.aggregate([
      { $unwind: "$products" },
      { $match: { "products.sellerId": new ObjectId(sellerId) } },
      {
        $project: {
          orderId: "$_id",
          customerEmail: "$email",
          productName: "$products.name",
          quantity: "$products.quantity",
          totalPrice: { $multiply: ["$products.price", "$products.quantity"] },
          orderStatus: 1,
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray();

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSellerStats, getSellerOrders };