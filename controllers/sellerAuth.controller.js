const { connectDB, ObjectId } = require("../config/db");

const applyForSeller = async (req, res) => {
  try {
    const db = await connectDB();
    const sellerCollection = db.collection("bazzar_seller");
    const userCollection = db.collection("bazzar_users");
    const userId = req.user.id;

    const {
      storeName,
      storeEmail,
      storePhone,
      storeDescription,
      businessAddress,
      nidNumber,
      bankName,
      accountNumber,
      mfsNumber,
    } = req.body;

    const existingSeller = await sellerCollection.findOne({ userId: new ObjectId(userId) });
    if (existingSeller) {
      return res.status(400).json({ success: false, message: "Already applied or a seller!" });
    }

    const storeSlug = storeName.toLowerCase().split(' ').join('-');

    const newSeller = {
      userId: new ObjectId(userId),
      storeName,
      storeEmail,
      storePhone,
      storeDescription,
      storeSlug,
      businessAddress,
      nidNumber,
      verificationDetails: {
        bankName,
        accountNumber,
        mfsNumber,
      },
      approvalStatus: "pending",
      sellerRating: 0,
      isActive: false,
      joinedAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await sellerCollection.insertOne(newSeller);

    await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role: "seller", sellerProfileId: result.insertedId } }
    );

    res.status(201).json({ success: true, message: "Seller application submitted!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSellerByEmail = async (req, res) => {
  try {
    const db = await connectDB();
    const sellerCollection = db.collection("bazzar_seller");
    const { email } = req.params;

    const seller = await sellerCollection.findOne({ storeEmail: email });

    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found!" });
    }

    res.status(200).json({ success: true, data: seller });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSellerProfile = async (req, res) => {
  try {
    const db = await connectDB();
    const sellerCollection = db.collection("bazzar_seller");
    const userId = req.user.id;
    const updateData = req.body;

    await sellerCollection.updateOne(
      { userId: new ObjectId(userId) },
      { 
        $set: { 
          storeName: updateData.storeName,
          storeDescription: updateData.storeDescription,
          businessAddress: updateData.businessAddress,
          storePhone: updateData.storePhone,
          updatedAt: new Date()
        } 
      }
    );

    res.status(200).json({ success: true, message: "Seller profile updated!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSellerAccount = async (req, res) => {
  try {
    const db = await connectDB();
    const sellerCollection = db.collection("bazzar_seller");
    const userCollection = db.collection("bazzar_users");
    const { id } = req.params;

    const seller = await sellerCollection.findOne({ _id: new ObjectId(id) });
    if (seller) {
      await userCollection.updateOne(
        { _id: seller.userId },
        { $set: { role: "customer" }, $unset: { sellerProfileId: "" } }
      );
    }

    await sellerCollection.deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({ success: true, message: "Seller account deleted!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllSellers = async (req, res) => {
  try {
    const db = await connectDB();
    const sellerCollection = db.collection("bazzar_seller");
    const sellers = await sellerCollection.find().sort({ joinedAt: -1 }).toArray();

    res.status(200).json({ success: true, data: sellers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  applyForSeller, 
  getSellerByEmail, 
  updateSellerProfile, 
  deleteSellerAccount, 
  getAllSellers 
};