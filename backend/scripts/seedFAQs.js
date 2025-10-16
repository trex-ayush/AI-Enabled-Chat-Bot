const mongoose = require("mongoose");
const FAQ = require("../models/faq");
require("dotenv").config();

const sampleFAQs = [
  {
    question: "How do I reset my password?",
    answer:
      "You can reset your password by clicking 'Forgot Password' on the login page and following the instructions sent to your email.",
    category: "Account",
    tags: ["password", "login", "reset"],
  },
  {
    question: "What are your business hours?",
    answer:
      "Our customer support is available 24/7 through this AI assistant. For urgent matters, we escalate to human agents during business hours (9 AM - 6 PM EST).",
    category: "General",
    tags: ["hours", "support", "availability"],
  },
  {
    question: "How can I track my order?",
    answer:
      "You can track your order by logging into your account and visiting the 'Order History' section, or by using the tracking link sent to your email.",
    category: "Orders",
    tags: ["tracking", "order", "shipping"],
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept Visa, MasterCard, American Express, PayPal, and Apple Pay.",
    category: "Billing",
    tags: ["payment", "credit card", "checkout"],
  }
];

async function seedFAQs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("📡 Connected to MongoDB");

    // Clear existing FAQs
    await FAQ.deleteMany({});
    console.log("🧹 Cleared existing FAQs");

    const result = await FAQ.insertMany(sampleFAQs);
    console.log(`✅ Added ${result.length} FAQs to database`);

    console.log("\n📋 Seeded FAQs:");
    result.forEach((faq) => {
      console.log(`- [${faq.category}] ${faq.question}`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

seedFAQs();

module.exports = { seedFAQs, sampleFAQs };
