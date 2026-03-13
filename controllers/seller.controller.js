const { connectDB, ObjectId } = require("../config/db");

const getSellerStats = async (req, res) => {
  try {
    const db = await connectDB();
    const ordersCollection = db.collection("bazzar_orders");
    const productsCollection = db.collection("bazzar_products");
    const sellerId = req.user.id;

    const orderStats = await ordersCollection.aggregate([
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

    const productStats = await productsCollection.aggregate([
      { $match: { "seller.sellerId": sellerId, "status.isDeleted": false } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: [{ $eq: ["$status.isActive", true] }, 1, 0] }
          },
          outOfStock: {
            $sum: { $cond: [{ $lte: ["$inventory.totalStock", 0] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    res.status(200).json({
      success: true,
      orders: orderStats.length > 0 ? orderStats[0] : { totalOrders: 0, pendingOrders: 0, successfulSales: 0, totalEarnings: 0 },
      products: productStats.length > 0 ? productStats[0] : { totalProducts: 0, activeProducts: 0, outOfStock: 0 }
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

const getSellerProductsList = async (req, res) => {
  try {
    const db = await connectDB();
    const productsCollection = db.collection("bazzar_products");
    const sellerId = req.user.id;

    const products = await productsCollection
      .find({ "seller.sellerId": sellerId, "status.isDeleted": false })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSellerStats, getSellerOrders, getSellerProductsList };