const Session = require('../models/session');
const EscalatedChat = require('../models/EscalatedChat');
const User = require('../models/user');
const { hashPassword } = require('./authController');

// Get all escalated chats with filters
const getEscalatedChats = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;

    const chats = await EscalatedChat.find(query)
      .populate('customerId', 'name email')
      .populate('assignedAdmin', 'name email')
      .sort({ 
        priority: -1, // High priority first
        createdAt: -1 
      })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await EscalatedChat.countDocuments(query);

    res.json({
      success: true,
      data: {
        chats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get escalated chats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch escalated chats.'
    });
  }
};

// Assign admin to escalated chat
const assignAdminToChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { adminId } = req.body;

    const chat = await EscalatedChat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Escalated chat not found.'
      });
    }

    const admin = await User.findOne({ _id: adminId, role: { $in: ['admin', 'support_agent'] } });
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin/support agent not found.'
      });
    }

    chat.assignedAdmin = adminId;
    chat.status = 'in_progress';
    
    // Add assignment note
    chat.adminNotes.push({
      adminId: req.user._id,
      note: `Assigned to ${admin.name} by ${req.user.name}`,
      timestamp: new Date()
    });
    
    await chat.save();

    // Update session status
    await Session.findOneAndUpdate(
      { sessionId: chat.sessionId },
      { status: 'escalated' }
    );

    await chat.populate('assignedAdmin', 'name email');
    await chat.populate('customerId', 'name email');

    res.json({
      success: true,
      message: 'Admin assigned successfully.',
      data: { chat }
    });
  } catch (error) {
    console.error('Assign admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign admin.'
    });
  }
};

// Admin sends message to escalated chat - FIXED VERSION
const adminSendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    console.log('🛠️ Admin sending message to session:', sessionId);
    console.log('📝 Message:', message);
    console.log('👤 Admin user:', req.user.name);

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required.'
      });
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found.'
      });
    }

    // Create admin message object
    const adminMessage = {
      role: 'assistant',
      content: `[Admin ${req.user.name}]: ${message}`,
      timestamp: new Date(),
      source: 'admin'
    };

    // Add admin message to conversation history
    session.conversationHistory.push(adminMessage);
    session.updatedAt = new Date();
    await session.save();

    console.log('✅ Admin message added to session:', sessionId);

    // Update escalated chat status and add note
    const escalatedChat = await EscalatedChat.findOne({ sessionId });
    if (escalatedChat) {
      escalatedChat.status = 'in_progress';
      escalatedChat.adminNotes.push({
        adminId: req.user._id,
        note: `Admin message sent: ${message.substring(0, 100)}...`,
        timestamp: new Date()
      });
      await escalatedChat.save();
      console.log('✅ Escalated chat updated');
    }

    res.json({
      success: true,
      message: 'Admin message sent successfully.',
      data: {
        sessionId,
        message: adminMessage
      }
    });
  } catch (error) {
    console.error('❌ Admin send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send admin message.'
    });
  }
};

// Resolve escalated chat
const resolveEscalatedChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { resolutionNotes } = req.body;

    const chat = await EscalatedChat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Escalated chat not found.'
      });
    }

    chat.status = 'resolved';
    chat.resolvedAt = new Date();
    
    // Add resolution notes
    chat.adminNotes.push({
      adminId: req.user._id,
      note: resolutionNotes || 'Issue resolved by admin.',
      timestamp: new Date()
    });

    await chat.save();

    // Update session status
    await Session.findOneAndUpdate(
      { sessionId: chat.sessionId },
      { status: 'resolved' }
    );

    res.json({
      success: true,
      message: 'Chat resolved successfully.',
      data: { chat }
    });
  } catch (error) {
    console.error('Resolve chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve chat.'
    });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const totalSessions = await Session.countDocuments();
    const escalatedSessions = await Session.countDocuments({ status: 'escalated' });
    const resolvedSessions = await Session.countDocuments({ status: 'resolved' });
    
    const pendingChats = await EscalatedChat.countDocuments({ status: 'pending' });
    const inProgressChats = await EscalatedChat.countDocuments({ status: 'in_progress' });
    const resolvedChats = await EscalatedChat.countDocuments({ status: 'resolved' });
    
    const highPriorityChats = await EscalatedChat.countDocuments({ priority: 'high', status: { $in: ['pending', 'in_progress'] } });
    
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: { $in: ['admin', 'support_agent'] } });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSessions = await Session.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const recentEscalations = await EscalatedChat.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      data: {
        sessions: {
          total: totalSessions,
          escalated: escalatedSessions,
          resolved: resolvedSessions,
          recent: recentSessions
        },
        escalatedChats: {
          pending: pendingChats,
          inProgress: inProgressChats,
          resolved: resolvedChats,
          highPriority: highPriorityChats,
          recent: recentEscalations
        },
        users: {
          total: totalUsers,
          admins: totalAdmins
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics.'
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users.'
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email.'
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'customer'
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user.'
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, role, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, role, isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully.',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user.'
    });
  }
};

// Get chat details with full conversation
const getChatDetails = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await EscalatedChat.findById(chatId)
      .populate('customerId', 'name email')
      .populate('assignedAdmin', 'name email')
      .populate('adminNotes.adminId', 'name email');

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found.'
      });
    }

    // Get session conversation
    const session = await Session.findOne({ sessionId: chat.sessionId });
    
    res.json({
      success: true,
      data: {
        chat,
        conversation: session ? session.conversationHistory : []
      }
    });
  } catch (error) {
    console.error('Get chat details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat details.'
    });
  }
};

// Add admin note to escalated chat
const addAdminNote = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { note } = req.body;

    const chat = await EscalatedChat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Escalated chat not found.'
      });
    }

    chat.adminNotes.push({
      adminId: req.user._id,
      note: note,
      timestamp: new Date()
    });

    await chat.save();

    await chat.populate('adminNotes.adminId', 'name email');

    res.json({
      success: true,
      message: 'Note added successfully.',
      data: { chat }
    });
  } catch (error) {
    console.error('Add admin note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add note.'
    });
  }
};

module.exports = {
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
};