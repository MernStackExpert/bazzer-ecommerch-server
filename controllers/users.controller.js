const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken')
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
  tls: {
    rejectUnauthorized: false
  }
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

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userCollection = await getUserCollection();

    const user = await userCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockUntil - new Date()) / (1000 * 60 * 60));
      return res.status(403).json({ success: false, message: `Account locked. Try again after ${remainingTime} hours.` });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      const newAttempts = (user.loginAttempts || 0) + 1;
      if (newAttempts >= 5) {
        const lockTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await userCollection.updateOne({ email }, { $set: { loginAttempts: 0, lockUntil: lockTime } });
        return res.status(403).json({ success: false, message: "Too many attempts! Account locked for 24 hours." });
      } else {
        await userCollection.updateOne({ email }, { $set: { loginAttempts: newAttempts } });
        return res.status(401).json({ success: false, message: `Invalid password! ${5 - newAttempts} attempts left.` });
      }
    }

    const loginOtp = crypto.randomBytes(4).toString('hex').toUpperCase();
    const loginOtpExpires = new Date(Date.now() + 5 * 60 * 1000); 

    await userCollection.updateOne(
      { email },
      { $set: { verificationCode: loginOtp, codeExpires: loginOtpExpires, loginAttempts: 0 } }
    );

    const mailOptions = {
      from: `"Bazzar Marketplace" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Login Verification Code",
      html: `<div style="padding: 20px; border: 1px solid #eee;">
               <h2>Login Verification</h2>
               <p>Use the code below to complete your login:</p>
               <h1 style="background: #f4f4f4; text-align: center;">${loginOtp}</h1>
             </div>`
    };
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "A verification code has been sent to your email."
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const userCollection = await getUserCollection();

    const user = await userCollection.findOne({ email });

    
    if (!user || user.verificationCode !== otp) {
      return res.status(400).json({ success: false, message: "Invalid or expired code!" });
    }

    if (new Date() > user.codeExpires) {
      return res.status(400).json({ success: false, message: "Code expired!" });
    }

    await userCollection.updateOne(
      { email },
      { $unset: { verificationCode: "", codeExpires: "" } }
    );

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role }, 
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, image, address } = req.body;
    const userCollection = await getUserCollection();
    
    const userId = req.user.id; 

    const updatedData = {};
    if (name) updatedData.name = name;
    if (phone) updatedData.phone = phone;
    if (image) updatedData.image = image;
    if (address) updatedData.address = address;

    const result = await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updatedData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ success: false, message: "No changes made!" });
    }

    res.status(200).json({ success: true, message: "Profile updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userCollection = await getUserCollection();
    const userId = req.user.id;

    const user = await userCollection.findOne({ _id: new ObjectId(userId) });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Old password does not match!" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { password: hashedNewPassword } }
    );

    res.status(200).json({ success: true, message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerUser, verifyOTP , loginUser , verifyLoginOTP , updateProfile , updatePassword};