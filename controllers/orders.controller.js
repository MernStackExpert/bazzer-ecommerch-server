const { connectDB, ObjectId } = require("../config/db");
const sendOrderEmail = require("../utils/sendOrderEmail");


const collection = async () => {
  const db = await connectDB();
  return db.collection("bazzar_orders");
};

const getOrders = async (req, res) => {
  try {
    const ordersCollection = await collection();

    let query = {};
    if (req.query.email) {
      query.email = req.query.email;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalOrder = await ordersCollection.countDocuments(query);

    const orders = await ordersCollection
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();

    res.send({
      totalOrder,
      currentPage: page,
      totalPages: Math.ceil(totalOrder / limit),
      orders,
    });
  } catch (error) {
    res.status(500).send({ 
      message: "Failed to fetch orders", 
      error: error.message 
    });
  }
};

const getSingleOrder = async (req , res) => {
  try {
    const ordersCollection = await collection();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid orders id" });
    }
    const orders = await ordersCollection.findOne({ _id: new ObjectId(id) });
    if (!orders) {
      return res.status(404).send({ message: "orders not found" });
    }

    res.send(orders);
  } catch (error) {
    res.status(500).send({
      message: "Failed to fetch orders",
      error,
    });
  }
}

const createOrders = async (req, res) => {
  try {
    const ordersCollection = await collection();
    const db = await connectDB();
    const productsCollection = db.collection("bazzar_products");

    const {
      email,
      products,
      total,
      paymentMethod,
      shippingAddress,
      transactionId,
    } = req.body;

    if (!email || !products || products.length === 0 || !total) {
      return res.status(400).send({ message: "Invalid order data" });
    }

    const order = {
      userId: req.user ? new ObjectId(req.user.id) : null,
      email,
      products,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "pending" : "paid",
      transactionId: paymentMethod !== "COD" ? transactionId : null,
      orderStatus: "pending",
      shippingAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await ordersCollection.insertOne(order);

    const bulkOps = products.map((p) => ({
      updateOne: {
        filter: { _id: new ObjectId(p.productId) },
        update: { $inc: { "inventory.totalStock": -p.quantity } },
      },
    }));
    await productsCollection.bulkWrite(bulkOps);

    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0EA5A4; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">BAZZAR</h1>
          <p style="color: #e0f2f1; margin: 10px 0 0; font-size: 16px;">Thank you for your purchase!</p>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #1E293B; margin-top: 0; font-size: 20px;">Order Confirmed!</h2>
          <p style="font-size: 15px; color: #64748B;">Hi there, we've received your order and it's being processed. Here are your order details:</p>
          
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 5px 0; font-size: 14px;"><strong>Order ID:</strong> #${result.insertedId}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Payment:</strong> ${paymentMethod} (${paymentMethod === "COD" ? "Unpaid" : "Paid"})</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="border-bottom: 2px solid #f1f5f9;">
                <th style="text-align: left; padding: 12px 0; font-size: 14px; color: #1E293B;">Product</th>
                <th style="text-align: center; padding: 12px 0; font-size: 14px; color: #1E293B;">Qty</th>
                <th style="text-align: right; padding: 12px 0; font-size: 14px; color: #1E293B;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${products.map((p) => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 12px 0; font-size: 14px; color: #334155;">${p.name}</td>
                  <td style="padding: 12px 0; text-align: center; font-size: 14px; color: #334155;">${p.quantity}</td>
                  <td style="padding: 12px 0; text-align: right; font-size: 14px; color: #334155;">$${(p.price * p.quantity).toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div style="text-align: right; margin-top: 20px;">
            <p style="font-size: 18px; color: #1E293B; font-weight: bold; margin: 0;">Total Amount: <span style="color: #0EA5A4;">$${total.toFixed(2)}</span></p>
          </div>

          <div style="margin-top: 30px; border-top: 1px dashed #e2e8f0; padding-top: 20px;">
            <h4 style="margin: 0 0 10px; font-size: 15px; color: #1E293B;">Shipping Address:</h4>
            <p style="margin: 0; font-size: 14px; color: #64748B; line-height: 1.5;">${shippingAddress}</p>
          </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Bazzar Marketplace. All rights reserved.</p>
          <p style="margin: 5px 0 0;">If you have any questions, please contact our support team.</p>
        </div>
      </div>
    `;

    try {
      await sendOrderEmail({ to: email, subject: "Your Order has been Confirmed!", html });
    } catch (e) {
      console.error("Email Error:", e.message);
    }

    res.status(201).send({ success: true, orderId: result.insertedId });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to create order", error: error.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const ordersCollection = await collection();
    const id = req.params.id;
    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...req.body,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Order Not Found" });
    }

    res.send({ message: "Order updated successfully", result });
  } catch (error) {
    res.status(500).send({ message: "Failed to update order", error });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const ordersCollection = await collection();
    const id = req.params.id;
    const result = await ordersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Order Not Found" });
    }

    res.send({ message: "Order deleted successfully", result });
  } catch (error) {
    res.status(500).send({ message: "Failed to delete order", error });
  }
};

module.exports = { getOrders, createOrders, updateOrder, deleteOrder , getSingleOrder };