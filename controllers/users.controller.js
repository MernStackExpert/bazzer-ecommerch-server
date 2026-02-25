const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { connectDB, ObjectId } = require("../config/db");

const getUserCollection = async () => {
  const db = await connectDB();
  return db.collection("bazzar_users");
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userCollection = await getUserCollection();

    const existingUser = await userCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "This Email is Already in Use!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = crypto.randomBytes(4).toString('hex').toUpperCase();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: 'customer', 
      isVerified: false,
      verificationCode: otp,
      codeExpires: otpExpires,
      loginAttempts: 0,
      lockUntil: null,
      createdAt: new Date(),
    };

    const result = await userCollection.insertOne(newUser);

    const mailOptions = {
      from: `"Bazzar Marketplace" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Bazzar Account Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #f39c12;">Welcome to Bazzar!</h2>
          <p>Please use the following 8-character code to verify your account:</p>
          <h1 style="background: #f4f4f4; padding: 10px; text-align: center; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: "Registration successful! An 8-character code has been sent to your email.",
      userId: result.insertedId
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const userCollection = await getUserCollection();

    const user = await userCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.verificationCode !== otp) {
      return res.status(400).json({ success: false, message: "Invalid verification code!" });
    }

    if (new Date() > user.codeExpires) {
      return res.status(400).json({ success: false, message: "Code has expired. Please try again." });
    }

    await userCollection.updateOne(
      { email },
      { 
        $set: { isVerified: true }, 
        $unset: { verificationCode: "", codeExpires: "" } 
      }
    );

    res.status(200).json({
      success: true,
      message: "Your email has been successfully verified. You can now log in."
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerUser, verifyOTP };