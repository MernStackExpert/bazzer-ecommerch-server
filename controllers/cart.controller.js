const { connectDB, ObjectId } = require("../config/db");

const getCartCollection = async () => {
  const db = await connectDB();
  return db.collection("bazzar_cart");
};

const addToCart = async (req, res) => {
  try {
    const cartCollection = await getCartCollection();
    const userId = req.user.id; 
    const { productId, name, price, quantity, image, sellerId, userEmail, stock } = req.body;

    if (!productId || !quantity || !sellerId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const existingItem = await cartCollection.findOne({
      userId: new ObjectId(userId),
      productId: new ObjectId(productId)
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > stock) {
        return res.status(400).json({ success: false, message: "Not enough stock available" });
      }

      await cartCollection.updateOne(
        { _id: existingItem._id },
        { $set: { quantity: newQuantity, updatedAt: new Date() } }
      );

      return res.status(200).json({ success: true, message: "Cart quantity updated" });
    }

    const cartItem = {
      userId: new ObjectId(userId),
      userEmail, 
      productId: new ObjectId(productId),
      sellerId: new ObjectId(sellerId),
      name,
      price,
      image,
      quantity,
      stock,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await cartCollection.insertOne(cartItem);
    res.status(201).json({ success: true, message: "Added to cart successfully" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyCart = async (req, res) => {
  try {
    const cartCollection = await getCartCollection();
    const userId = req.user.id;

    const cartItems = await cartCollection
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, data: cartItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



module.exports = { addToCart, getMyCart };