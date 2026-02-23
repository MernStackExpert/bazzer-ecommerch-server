require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// ROUTES
const productRoutes = require("./routes/products.routes");

//  API
app.use("/api/products", productRoutes);

app.get("/", (req, res) => {
  res.send("E-commerce server running 🚀");
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
