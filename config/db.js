
// config/db.js
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

let db;

// MongoDB client
const client = new MongoClient(process.env.DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// connectDB function
const connectDB = async () => {
  if (!db) {
    await client.connect();
    db = client.db("bazaar_ecommerce_db");
    console.log("✅ MongoDB connected");
  }
  return db;
};

// export
module.exports = { connectDB, ObjectId };