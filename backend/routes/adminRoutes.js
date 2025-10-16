const express = require("express");
const router = express.Router();
const {
  getEscalatedChats,
  assignAdminToChat,
  adminSendMessage,
  resolveEscalatedChat,
  getDashboardStats,
  getAllUsers,
  createUser,
  updateUser,
  getChatDetails,
  addAdminNote
} = require("../controllers/adminController");
const { adminAuth } = require("../middleware/auth");

// Admin routes for escalated chats
router.get("/escalated-chats", adminAuth, getEscalatedChats);
router.get("/escalated-chats/:chatId", adminAuth, getChatDetails);
router.post("/escalated-chats/:chatId/assign", adminAuth, assignAdminToChat);
router.post("/escalated-chats/:chatId/notes", adminAuth, addAdminNote);
router.post("/sessions/:sessionId/admin-message", adminAuth, adminSendMessage);
router.post("/escalated-chats/:chatId/resolve", adminAuth, resolveEscalatedChat);

// Admin dashboard and user management
router.get("/dashboard/stats", adminAuth, getDashboardStats);
router.get("/users", adminAuth, getAllUsers);
router.post("/users", adminAuth, createUser);
router.put("/users/:userId", adminAuth, updateUser);

module.exports = router;