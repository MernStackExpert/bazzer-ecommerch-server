require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// middleware
// app.use(
//   cors({
//     origin: ["http://localhost:3000"],
//     credentials: true,
//     methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   }),
// );

app.use(cors())

app.use(express.json());

// ROUTES
const productRoutes = require("./routes/products.routes");

// users
const usersRoutes = require("./routes/user.routes");

// wishlist
const wishlistRoutes = require("./routes/wishlist.routes");

// orders api
const orderRoutes = require("./routes/order.routes");

// seller info
const sellerRoutes = require("./routes/seller.routes");

//  API
app.use("/api/products", productRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/seller", sellerRoutes);


app.get("/", (req, res) => {
  res.send("E-commerce server running 🚀");
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
