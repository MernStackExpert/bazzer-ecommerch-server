const { connectDB, ObjectId } = require("../config/db");

const getAdminStats = async (req, res) => {
  try {
    const db = await connectDB();
    const ordersCollection = db.collection("bazzar_orders");
    const usersCollection = db.collection("bazzar_users");
    const productsCollection = db.collection("bazzar_products");

    const totalUsers = await usersCollection.countDocuments({ role: "customer" });
    const totalSellers = await usersCollection.countDocuments({ role: "seller" });

    const totalProducts = await productsCollection.countDocuments({ "status.isDeleted": false });

    const orderStats = await ordersCollection.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "pending"] }, 1, 0] }
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    res.status(200).json({
      success: true,
      stats: {
        users: totalUsers,
        sellers: totalSellers,
        products: totalProducts,
        orders: orderStats.length > 0 ? orderStats[0] : { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, completedOrders: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllOrdersAdmin = async (req, res) => {
  try {
    const db = await connectDB();
    const ordersCollection = db.collection("bazzar_orders");

    const orders = await ordersCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAdminStats, getAllOrdersAdmin };