const Session = require('../models/session');
const FAQ = require('../models/faq');
const EscalatedChat = require('../models/EscalatedChat');
const User = require('../models/user');
const { createGeminiClient } = require('../utils/geminiClient');
const { v4: uuidv4 } = require('uuid');

const geminiClient = createGeminiClient(process.env.GEMINI_API_KEY);

geminiClient.testConnection().then(success => {
  if (success) {
    console.log('🚀 Gemini AI is ready for customer support');
  }
});

const checkFAQ = async (query) => {
  try {
    const cleanQuery = query.toLowerCase().trim();
    
    console.log('🔍 FAQ search for:', cleanQuery);

    const faq = await FAQ.findOne({
      $or: [
        { question: { $regex: cleanQuery, $options: 'i' } },
        { answer: { $regex: cleanQuery, $options: 'i' } },
        { tags: { $in: [cleanQuery] } }
      ]
    });

    if (faq) {
      console.log('✅ FAQ match:', faq.question);
      return faq;
    }

    const words = cleanQuery.split(' ').filter(word => word.length > 3);
    
    if (words.length > 0) {
      const keywordFaq = await FAQ.findOne({
        $or: [
          { question: { $regex: words.join('|'), $options: 'i' } },
          { tags: { $in: words } }
        ]
      });

      if (keywordFaq) {
        console.log('✅ FAQ keyword match:', keywordFaq.question);
        return keywordFaq;
      }
    }

    console.log('❌ No FAQ found');
    return null;

  } catch (error) {
    console.error('FAQ check error:', error);
    return null;
  }
};

const checkEscalation = (aiResponse, userMessage) => {
  const escalationKeywords = [
    'escalat', 'human', 'agent', 'manager', 'supervisor', 
    'complaint', 'urgent', 'emergency', 'not working', 'broken',
    'speak to', 'real person', 'live agent', 'can\'t help',
    'frustrated', 'angry', 'disappointed', 'terrible', 'awful',
    'cancel my account', 'delete my account', 'want to cancel',
    'legal action', 'sue', 'lawyer', 'supervisor', 'manager now'
  ];
  
  const lowerResponse = aiResponse.toLowerCase();
  const lowerMessage = userMessage.toLowerCase();
  
  const hasEscalationKeyword = escalationKeywords.some(keyword => 
    lowerResponse.includes(keyword) || lowerMessage.includes(keyword)
  );

  // Check for multiple negative sentiment indicators
  const negativeWords = ['frustrated', 'angry', 'disappointed', 'terrible', 'awful', 'horrible', 'worst'];
  const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
  
  const hasHighNegativeSentiment = negativeCount >= 2;
  
  // Check for urgent requests
  const hasUrgentRequest = lowerMessage.includes('urgent') || 
                          lowerMessage.includes('emergency') || 
                          lowerMessage.includes('immediately') ||
                          lowerMessage.includes('right now');

  console.log('🚨 Escalation check:', {
    hasEscalationKeyword,
    hasHighNegativeSentiment,
    hasUrgentRequest,
    negativeCount
  });

  return hasEscalationKeyword || hasHighNegativeSentiment || hasUrgentRequest;
};

const isCustomerSupportQuery = (message) => {
  const supportKeywords = [
    'account', 'login', 'password', 'sign up', 'register', 'profile', 'settings',
    'order', 'track', 'shipping', 'delivery', 'return', 'refund', 'cancel',
    'payment', 'billing', 'invoice', 'charge', 'price', 'cost', 'fee',
    'error', 'problem', 'issue', 'not working', 'broken', 'fix', 'help',
    'support', 'help', 'contact', 'service', 'policy', 'terms', 'faq',
    'product', 'item', 'feature', 'how to', 'tutorial', 'guide'
  ];

  const lowerMessage = message.toLowerCase();
  return supportKeywords.some(keyword => lowerMessage.includes(keyword));
};

// Updated createSession - Only creates session ID, doesn't save to DB yet
const createSession = async (req, res) => {
  try {
    const sessionId = uuidv4();
    
    console.log('🆕 Generated session ID (not saved to DB yet):', sessionId);
    
    res.json({
      success: true,
      sessionId,
      message: 'Session ID generated successfully. Session will be created when user sends first message.'
    });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate session ID'
    });
  }
};

// Updated handleMessage - Creates session in DB only when user sends first message
const handleMessage = async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    const userId = req.user?._id || null;

    console.log('💬 Handling message for session:', sessionId, 'User:', userId);

    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and message are required'
      });
    }

    if (!isCustomerSupportQuery(message)) {
      return res.json({
        success: true,
        response: "I'm here to help with customer support questions like account issues, orders, billing, or technical support. How can I assist you with our services today?",
        source: 'system',
        sessionId,
        status: 'active',
        needsEscalation: false
      });
    }

    let session = await Session.findOne({ sessionId });
    
    // If session doesn't exist in DB, create it now (first message)
    if (!session) {
      console.log('💾 Creating new session in database for first message');
      session = new Session({ 
        sessionId,
        userId: userId,
        title: message.length > 50 ? message.substring(0, 47) + '...' : message,
        conversationHistory: [{
          role: 'system',
          content: 'New customer support session started',
          timestamp: new Date()
        }]
      });
      console.log('✅ Session created in database:', sessionId);
    } else {
      console.log('📝 Found existing session in database');
    }

    // Link user to session if authenticated and session doesn't have one
    if (userId && !session.userId) {
      console.log('🔗 Linking user to existing session:', userId);
      session.userId = userId;
    }

    if (session.status === 'resolved') {
      return res.status(400).json({
        success: false,
        error: 'This session has been resolved. Please start a new session.'
      });
    }

    // Add user message to history
    session.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    const faqMatch = await checkFAQ(message);
    if (faqMatch) {
      session.conversationHistory.push({
        role: 'assistant',
        content: faqMatch.answer,
        timestamp: new Date(),
        source: 'faq'
      });
      
      session.updatedAt = new Date();
      await session.save();
      console.log('✅ FAQ response sent and session saved with userId:', session.userId);
      
      return res.json({
        success: true,
        response: faqMatch.answer,
        source: 'faq',
        sessionId,
        status: session.status
      });
    }

    let aiResponse;
    try {
      aiResponse = await geminiClient.generateResponse(message, session.conversationHistory);
    } catch (aiError) {
      console.error('AI Response generation error:', aiError);
      aiResponse = "I apologize, but I'm having trouble processing your request right now. Please try again in a moment or contact our support team directly.";
    }

    const needsEscalation = checkEscalation(aiResponse, message);

    if (needsEscalation) {
      console.log('🚨 ESCALATING CONVERSATION TO HUMAN AGENT');
      session.status = 'escalated';
      
      // Determine priority
      let priority = 'medium';
      if (message.toLowerCase().includes('urgent') || message.toLowerCase().includes('emergency')) {
        priority = 'high';
      }
      if (message.toLowerCase().includes('cancel') || message.toLowerCase().includes('delete account')) {
        priority = 'high';
      }

      // Create or update escalated chat record
      let escalatedChat = await EscalatedChat.findOne({ sessionId });
      if (!escalatedChat) {
        escalatedChat = new EscalatedChat({
          sessionId: session.sessionId,
          customerId: userId,
          reason: 'AI detected need for human intervention - ' + (message.length > 100 ? message.substring(0, 100) + '...' : message),
          priority: priority,
          status: 'pending'
        });
      } else {
        escalatedChat.status = 'pending';
        escalatedChat.priority = priority;
        escalatedChat.reason = 'Re-escalated: ' + (message.length > 100 ? message.substring(0, 100) + '...' : message);
      }
      
      await escalatedChat.save();

      try {
        const summary = await geminiClient.summarizeConversation(session.conversationHistory);
        session.conversationHistory.push({
          role: 'system',
          content: `🚨 CONVERSATION ESCALATED TO HUMAN AGENT. Priority: ${priority.toUpperCase()}. Summary: ${summary}`,
          timestamp: new Date()
        });
        
        // Add escalation note to escalated chat
        escalatedChat.adminNotes.push({
          adminId: null, // System note
          note: `Automatically escalated. AI Summary: ${summary}`
        });
        await escalatedChat.save();
        
      } catch (summaryError) {
        console.error('Summary generation error:', summaryError);
        session.conversationHistory.push({
          role: 'system',
          content: `🚨 CONVERSATION ESCALATED TO HUMAN AGENT. Priority: ${priority.toUpperCase()}. Reason: ${escalatedChat.reason}`,
          timestamp: new Date()
        });
      }
    }

    // Add AI response to history
    session.conversationHistory.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      source: 'ai'
    });

    session.updatedAt = new Date();
    await session.save();

    console.log('✅ Message processed and session saved with userId:', session.userId);
    console.log('💾 Session details:', {
      sessionId: session.sessionId,
      userId: session.userId,
      title: session.title,
      status: session.status,
      messageCount: session.conversationHistory.length
    });

    res.json({
      success: true,
      response: aiResponse,
      source: 'ai',
      sessionId,
      status: session.status,
      needsEscalation
    });

  } catch (error) {
    console.error('Error handling message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const getSessionHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      sessionId: session.sessionId,
      conversation: session.conversationHistory,
      status: session.status,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ category: 1, question: 1 });
    
    res.json({
      success: true,
      faqs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const healthCheck = async (req, res) => {
  try {
    await Session.findOne().limit(1);
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        gemini_api: 'ready'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

const getUserChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    console.log('📚 Fetching chat history for user:', userId);

    const sessions = await Session.find({ userId })
      .select('sessionId title status createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Session.countDocuments({ userId });

    console.log(`✅ Found ${sessions.length} sessions for user ${userId}`);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user chat history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat history'
    });
  }
};

const getUserSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    console.log('🔍 Fetching session details:', sessionId, 'for user:', userId);

    const session = await Session.findOne({ sessionId, userId });
    if (!session) {
      console.log('❌ Session not found or access denied');
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    console.log('✅ Session details retrieved');

    res.json({
      success: true,
      data: {
        session: {
          sessionId: session.sessionId,
          title: session.title,
          status: session.status,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          conversation: session.conversationHistory
        }
      }
    });
  } catch (error) {
    console.error('Get user session details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session details'
    });
  }
};

module.exports = {
  createSession,
  handleMessage,
  getSessionHistory,
  getFAQs,
  healthCheck,
  getUserChatHistory,
  getUserSessionDetails
};