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

// add to cart routes
const cartRoutes = require("./routes/cart.routes");

// user state api
const userStateRoutes = require("./routes/userState.routes");

// admin info 
const adminRoutes = require("./routes/admin.routes");

// seller auth info
const sellerAuthRoutes = require("./routes/sellerAuth.routes");

// address api
const addressRoutes = require("./routes/address.routes");

//  API
app.use("/api/products", productRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/user-dashboard", userStateRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/seller-auth", sellerAuthRoutes);
app.use("/api/address", addressRoutes);

app.get("/", (req, res) => {
  res.send("E-commerce server running 🚀");
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
