const { connectDB, ObjectId } = require("../config/db");

const getUserStats = async (req, res) => {
  try {
    const db = await connectDB();
    const ordersCollection = db.collection("bazzar_orders");
    const wishlistCollection = db.collection("bazzar_wishlist");
    const cartCollection = db.collection("bazzar_cart");
    
    const userId = req.user.id;
    const userEmail = req.user.email;

    const orderStats = await ordersCollection.aggregate([
      { $match: { email: userEmail } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$total" },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "pending"] }, 1, 0] }
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    const totalWishlist = await wishlistCollection.countDocuments({ 
      userId: new ObjectId(userId) 
    });

    const totalCartItems = await cartCollection.countDocuments({ 
      userId: new ObjectId(userId) 
    });

    res.status(200).json({
      success: true,
      stats: {
        orders: orderStats.length > 0 ? orderStats[0] : { totalOrders: 0, totalSpent: 0, pendingOrders: 0, completedOrders: 0 },
        wishlistCount: totalWishlist,
        cartCount: totalCartItems
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const db = await connectDB();
    const ordersCollection = db.collection("bazzar_orders");
    const userEmail = req.user.email;

    const orders = await ordersCollection
      .find({ email: userEmail })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUserStats, getUserOrders };