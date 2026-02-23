const { connectDB, ObjectId } = require("../config/db");

const collection = async () => {
  const db = await connectDB();
  return db.collection("bazzar_products");
};

const getAllProducts = async (req, res) => {
  try {
    const productCollection = await collection();
    const query = {
      "status.approval": "approved",
      "status.isDeleted": false
    };

    if (req.query.sellerId) {
      query["seller.sellerId"] = req.query.sellerId;
    }

    if (req.query.category) {
      query["category.slug"] = req.query.category;
    }

    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { brand: { $regex: req.query.search, $options: "i" } },
        { tags: { $in: [new RegExp(req.query.search, "i")] } }
      ];
    }

    if (req.query.minPrice || req.query.maxPrice) {
      query["pricing.basePrice"] = {};
      if (req.query.minPrice) query["pricing.basePrice"].$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query["pricing.basePrice"].$lte = Number(req.query.maxPrice);
    }

    if (req.query.rating) {
      query["rating.average"] = { $gte: Number(req.query.rating) };
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    let sort = { createdAt: -1 }; 
    if (req.query.sortBy) {
      const order = req.query.order === "desc" ? -1 : 1;
      const sortField = req.query.sortBy === "price" ? "pricing.basePrice" : req.query.sortBy;
      sort = { [sortField]: order };
    }

    const totalProducts = await productCollection.countDocuments(query);
    const products = await productCollection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    res.send({
      success: true,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ message: "Failed to fetch products", error: error.message });
  }
};


const getProductById = async (req, res) => {
  try {
    const productCollection = await collection();
    const { id } = req.params; 
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        success: false,
        message: "Invalid Product ID format!"
      });
    }

    const product = await productCollection.findOne({
      _id: new ObjectId(id),
      "status.isDeleted": false
    });

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found!"
      });
    }

    const relatedProducts = await productCollection
      .find({
        "category.id": product.category.id,
        _id: { $ne: product._id },
        "status.approval": "approved"
      })
      .limit(4)
      .toArray();

    res.status(200).send({
      success: true,
      data: product,
      relatedProducts: relatedProducts
    });

  } catch (error) {
    console.error("Error fetching product by ID:", error);
    res.status(500).send({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
};

const getSellerProducts = async (req, res) => {
  try {
    const productCollection = await collection();
    const { sellerId } = req.params; 
    const { status, deleted } = req.query;
    if (!sellerId) {
      return res.status(400).send({ success: false, message: "Seller ID is required!" });
    }

    const query = { 
      "seller.sellerId": sellerId 
    };


    if (deleted === "true") {
      query["status.isDeleted"] = true;
    } else if (deleted === "false") {
      query["status.isDeleted"] = false;
    }

    if (status) {
      query["status.approval"] = status;
    }

    const products = await productCollection
      .find(query)
      .sort({ createdAt: -1 }) 
      .toArray();

    res.status(200).send({
      success: true,
      count: products.length,
      products: products
    });

  } catch (error) {
    console.error("Error fetching seller products:", error);
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
};


const addProduct = async (req, res) => {
  try {
    const productCollection = await collection();
    const productData = req.body;

   
    const { userRole } = req.body; 
    if (userRole !== "seller" && userRole !== "admin") {
      return res.status(403).send({ 
        success: false, 
        message: "Forbidden! Only sellers or admins can add products." 
      });
    }

    const newProduct = {
      ...productData,
      slug: productData.name.toLowerCase().replace(/ /g, "-") + "-" + Date.now(),
      status: {
        approval: "approved",
        isActive: true,
        isDeleted: false
      },
      analytics: {
        views: 0,
        salesCount: 0,
        wishlistCount: 0
      },
      rating: {
        average: 0,
        totalReviews: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await productCollection.insertOne(newProduct);

    if (result.insertedId) {
      res.status(201).send({
        success: true,
        message: "Product added successfully!",
        productId: result.insertedId
      });
    }

  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).send({ 
      success: false, 
      message: "Failed to add product", 
      error: error.message 
    });
  }
};


const updateProduct = async (req, res) => {
  try {
    const productCollection = await collection();
    const { id } = req.params; 
    const { sellerId, userRole, ...updateData } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ success: false, message: "Invalid Product ID!" });
    }

    const existingProduct = await productCollection.findOne({ _id: new ObjectId(id) });

    if (!existingProduct) {
      return res.status(404).send({ success: false, message: "Product not found!" });
    }

    if (userRole !== "admin" && existingProduct.seller.sellerId !== sellerId) {
      return res.status(403).send({ 
        success: false, 
        message: "Unauthorized! You can only update your own products." 
      });
    }

    const finalUpdateData = {
      ...updateData,
      updatedAt: new Date() 
    };

    if (updateData.name) {
      finalUpdateData.slug = updateData.name.toLowerCase().replace(/ /g, "-") + "-" + Date.now();
    }

    const result = await productCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: finalUpdateData }
    );

    if (result.modifiedCount > 0) {
      res.status(200).send({
        success: true,
        message: "Product updated successfully!",
      });
    } else {
      res.status(400).send({ success: false, message: "No changes made to the product." });
    }

  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const productCollection = await collection();
    const { id } = req.params;
    const { sellerId, userRole } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ success: false, message: "Invalid Product ID!" });
    }

    const product = await productCollection.findOne({ _id: new ObjectId(id) });

    if (!product) {
      return res.status(404).send({ success: false, message: "Product not found!" });
    }

    if (userRole !== "admin" && product.seller.sellerId !== sellerId) {
      return res.status(403).send({ 
        success: false, 
        message: "Unauthorized! You can only delete your own products." 
      });
    }

    const result = await productCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          "status.isDeleted": true, 
          "status.isActive": false,
          updatedAt: new Date() 
        } 
      }
    );

    if (result.modifiedCount > 0) {
      res.status(200).send({
        success: true,
        message: "Product deleted successfully (Soft Delete)!"
      });
    } else {
      res.status(400).send({ success: false, message: "Failed to delete the product." });
    }

  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
};

const updateProductAnalytics = async (req, res) => {
  try {
    const productCollection = await collection();
    const { id } = req.params; 
    const { type } = req.body; 
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ success: false, message: "Invalid Product ID!" });
    }

    let updateField = {};
    if (type === "view") {
      updateField = { "analytics.views": 1 };
    } else if (type === "sale") {
      updateField = { "analytics.salesCount": 1 };
    } else if (type === "wishlist") {
      updateField = { "analytics.wishlistCount": 1 };
    } else {
      return res.status(400).send({ success: false, message: "Invalid analytics type!" });
    }

    const result = await productCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $inc: updateField,
        $set: { updatedAt: new Date() } 
      }
    );

    if (result.modifiedCount > 0) {
      res.status(200).send({
        success: true,
        message: `Product ${type} updated successfully!`
      });
    } else {
      res.status(404).send({ success: false, message: "Product not found!" });
    }

  } catch (error) {
    console.error("Error updating analytics:", error);
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
};





module.exports = { getAllProducts, getProductById , addProduct , updateProduct , deleteProduct , updateProductAnalytics , getSellerProducts};