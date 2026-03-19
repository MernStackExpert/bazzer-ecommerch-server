const { connectDB, ObjectId } = require("../config/db");

const getAddressCollection = async () => {
  const db = await connectDB();
  return db.collection("bazzar_addresses");
};

const saveAddress = async (req, res) => {
  try {
    const addressCollection = await getAddressCollection();
    const { 
      userName, userEmail, userPhoneNumber, userCountry, 
      userCity, userThana, userPostCode, userFullAddress, 
      addressType, isDefault 
    } = req.body;

    if (isDefault) {
      await addressCollection.updateMany(
        { userEmail: userEmail },
        { $set: { isDefault: false } }
      );
    }

    const addressData = {
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await addressCollection.insertOne(addressData);
    res.status(201).json({ success: true, message: "Address saved!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAddressByEmail = async (req, res) => {
  try {
    const addressCollection = await getAddressCollection();
    const { email } = req.params;

    const address = await addressCollection.findOne({ userEmail: email });

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found!" });
    }

    res.status(200).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAddressByEmail = async (req, res) => {
  try {
    const addressCollection = await getAddressCollection();
    const { email } = req.params;

    if (req.body.isDefault) {
      await addressCollection.updateMany(
        { userEmail: email },
        { $set: { isDefault: false } }
      );
    }

    const updatedData = {
      ...req.body,
      updatedAt: new Date()
    };

    const result = await addressCollection.updateOne(
      { userEmail: email },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Address not found!" });
    }

    res.status(200).json({ success: true, message: "Address updated!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAddressByEmail = async (req, res) => {
  try {
    const addressCollection = await getAddressCollection();
    const { email } = req.params;

    const result = await addressCollection.deleteOne({ userEmail: email });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Address not found!" });
    }

    res.status(200).json({ success: true, message: "Address deleted!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllAddresses = async (req, res) => {
  try {
    const addressCollection = await getAddressCollection();
    const addresses = await addressCollection.find().toArray();

    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  saveAddress, 
  getAddressByEmail, 
  updateAddressByEmail, 
  deleteAddressByEmail, 
  getAllAddresses 
};