const express = require('express');
const router = express.Router();
const {
  createSession,
  handleMessage,
  getSessionHistory,
  getFAQs,
  healthCheck,
  getUserChatHistory,
  getUserSessionDetails
} = require('../controllers/supportController');
const { auth } = require('../middleware/auth');

// Public support routes (no auth required for customer support)
router.post('/sessions', createSession);
router.get('/sessions/:sessionId', getSessionHistory);
router.post('/chat', auth, handleMessage); // Add auth middleware to get user info
router.get('/faqs', getFAQs);
router.get('/health', healthCheck);

// Protected routes for user chat history (requires authentication)
router.get('/user/chats', auth, getUserChatHistory);
router.get('/user/sessions/:sessionId', auth, getUserSessionDetails);

// Add authenticated session creation for logged-in users
router.post('/user/sessions', auth, createSession);

module.exports = router;