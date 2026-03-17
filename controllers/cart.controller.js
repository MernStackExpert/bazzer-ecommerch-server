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

const updateCartQuantity = async (req, res) => {
  try {
    const cartCollection = await getCartCollection();
    const { id } = req.params;
    const { action } = req.body; 

    const item = await cartCollection.findOne({ _id: new ObjectId(id) });
    if (!item) return res.status(404).json({ message: "Item not found" });

    let newQuantity = item.quantity;
    if (action === "increase") {
      if (newQuantity >= item.stock) return res.status(400).json({ message: "Stock limit reached" });
      newQuantity += 1;
    } else if (action === "decrease") {
      if (newQuantity <= 1) return res.status(400).json({ message: "Quantity cannot be less than 1" });
      newQuantity -= 1;
    }

    await cartCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { quantity: newQuantity, updatedAt: new Date() } }
    );

    res.status(200).json({ success: true, message: "Quantity updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const cartCollection = await getCartCollection();
    const { id } = req.params;

    const result = await cartCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Item not found" });

    res.status(200).json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addToCart, getMyCart, updateCartQuantity, removeFromCart };