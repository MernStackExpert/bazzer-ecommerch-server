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



module.exports = { getAllProducts};