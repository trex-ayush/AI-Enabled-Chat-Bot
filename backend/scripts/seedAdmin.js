const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("📡 Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@company.com" });
    if (existingAdmin) {
      console.log("✅ Admin user already exists");
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash("admin123", 10); // 10 is the salt rounds

    // Create admin user
    const admin = new User({
      name: "System Administrator",
      email: "admin@company.com",
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();
    console.log("✅ Admin user created successfully");
    console.log("📧 Email: admin@company.com");
    console.log("🔑 Password: admin123");
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Only run if called directly
if (require.main === module) {
  seedAdmin();
}

module.exports = { seedAdmin };
