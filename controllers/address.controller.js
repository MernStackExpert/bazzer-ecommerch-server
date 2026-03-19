const { connectDB, ObjectId } = require("../config/db");

const getAddressCollection = async () => {
  const db = await connectDB();
  return db.collection("bazzar_addresses");
};

const saveOrUpdateAddress = async (req, res) => {
  try {
    const addressCollection = await getAddressCollection();
    const userId = req.user.id;
    const { 
      userName, 
      userEmail, 
      userPhoneNumber, 
      userCountry, 
      userCity, 
      userThana, 
      userPostCode, 
      userFullAddress,
      addressType, 
      isDefault 
    } = req.body;

    const addressData = {
      userId: new ObjectId(userId),
      userName,
      userEmail,
      userPhoneNumber,
      userCountry,
      userCity,
      userThana,
      userPostCode,
      userFullAddress,
      addressType: addressType || "Home",
      isDefault: isDefault || false,
      updatedAt: new Date()
    };

    if (isDefault) {
      await addressCollection.updateMany(
        { userId: new ObjectId(userId) },
        { $set: { isDefault: false } }
      );
    }

    const result = await addressCollection.updateOne(
      { userId: new ObjectId(userId) },
      { $set: addressData, $setOnInsert: { createdAt: new Date() } },
      { upsert: true } 
    );

    res.status(200).json({ success: true, message: "Address saved successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyAddress = async (req, res) => {
  try {
    const addressCollection = await getAddressCollection();
    const userId = req.user.id;

    const address = await addressCollection.findOne({ userId: new ObjectId(userId) });

    if (!address) {
      return res.status(404).json({ success: false, message: "No address found!" });
    }

    res.status(200).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { saveOrUpdateAddress, getMyAddress };