const { connectDB, ObjectId } = require("../config/db");

const getWishlistCollection = async () => {
  const db = await connectDB();
  return db.collection("bazzar_wishlist");
};

const getProductCollection = async () => {
  const db = await connectDB();
  return db.collection("bazzar_products"); 
};

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id; 
    const wishlistCollection = await getWishlistCollection();

    const existingItem = await wishlistCollection.findOne({
      userId: new ObjectId(userId),
      productId: new ObjectId(productId),
    });

    if (existingItem) {
      return res.status(400).json({ success: false, message: "Product already in wishlist" });
    }

    const wishlistItem = {
      userId: new ObjectId(userId),
      productId: new ObjectId(productId),
      addedAt: new Date(),
    };

    await wishlistCollection.insertOne(wishlistItem);
    res.status(201).json({ success: true, message: "Product added to wishlist" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const wishlistCollection = await getWishlistCollection();

    const wishlistItems = await wishlistCollection.aggregate([
      { $match: { userId: new ObjectId(userId) } },
      {
        $lookup: {
          from: "bazzar_products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: 1,
          addedAt: 1,
          product: "$productDetails",
        },
      },
    ]).toArray();

    res.status(200).json({ success: true, data: wishlistItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { id } = req.params; 
    const wishlistCollection = await getWishlistCollection();

    const result = await wishlistCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.status(200).json({ success: true, message: "Product removed from wishlist" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addToWishlist, getMyWishlist, removeFromWishlist };