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




module.exports = { getAllProducts,  addProduct};