import React, { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../../utils/api';

const ChatDetailsModal = ({ chat, onClose, onResolve, onAssign }) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const conversationEndRef = useRef(null);
  const modalRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.conversation]);

  // ESC key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSendMessage = async () => {
    if (!adminMessage.trim()) return;
    
    setSendingMessage(true);
    try {
      console.log('🛠️ Sending admin message:', adminMessage);
      const response = await adminAPI.sendAdminMessage(chat.sessionId, adminMessage);
      
      if (response.data.success) {
        console.log('✅ Admin message sent successfully');
        setAdminMessage('');
        
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        notification.textContent = 'Message sent successfully!';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
        
        // Refresh chat data
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('❌ Error sending admin message:', error);
      alert('Error sending message: ' + (error.response?.data?.error || error.message));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      alert('Please add resolution notes');
      return;
    }
    
    if (window.confirm('Are you sure you want to resolve this chat?')) {
      await onResolve(chat._id, resolutionNotes);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSendMessage();
    }
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      high: 'bg-red-100 text-red-700 border border-red-200',
      medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      low: 'bg-green-100 text-green-700 border border-green-200'
    };
    const icons = {
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    };
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${styles[priority]}`}>
        <span>{icons[priority]}</span>
        {priority.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      in_progress: 'bg-blue-100 text-blue-700 border border-blue-200',
      resolved: 'bg-green-100 text-green-700 border border-green-200'
    };
    const labels = {
      pending: 'PENDING',
      in_progress: 'IN PROGRESS',
      resolved: 'RESOLVED'
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageIcon = (role, source) => {
    if (source === 'admin') return '👨‍💼';
    if (role === 'user') return '👤';
    if (role === 'system') return '🤖';
    return '💬';
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                Escalated Chat Details
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs sm:text-sm font-mono font-semibold">
                  {chat.sessionId.substring(0, 12)}...
                </span>
                {getPriorityBadge(chat.priority)}
                {getStatusBadge(chat.status)}
                {chat.customerId && (
                  <span className="bg-gray-700 text-white px-3 py-1 rounded-lg text-xs sm:text-sm font-medium">
                    👤 {chat.customerId.name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Actions Toggle */}
        <div className="lg:hidden border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowMobileActions(!showMobileActions)}
            className="w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center justify-between"
          >
            <span>Admin Actions & Info</span>
            <svg 
              className={`w-5 h-5 transition-transform ${showMobileActions ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Conversation Panel */}
          <div className={`flex-1 flex flex-col overflow-hidden ${showMobileActions ? 'hidden lg:flex' : 'flex'}`}>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sticky top-0 bg-gray-50 pb-2">
                💬 Conversation History
              </h3>
              
              {chat.conversation && chat.conversation.length > 0 ? (
                <div className="space-y-4">
                  {chat.conversation.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md'
                            : message.role === 'system'
                            ? 'bg-yellow-50 text-yellow-900 border-2 border-yellow-200 rounded-bl-md'
                            : message.source === 'admin'
                            ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white border-2 border-purple-300 rounded-bl-md'
                            : 'bg-white text-gray-800 border-2 border-gray-200 rounded-bl-md'
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-1">
                          <span className="text-sm">{getMessageIcon(message.role, message.source)}</span>
                          <span className={`text-xs font-semibold ${
                            message.role === 'user' || message.source === 'admin' 
                              ? 'text-white opacity-90' 
                              : 'text-gray-600'
                          }`}>
                            {message.source === 'admin' ? 'Admin Response' : 
                             message.role === 'user' ? 'Customer' : 
                             message.role === 'system' ? 'System' : 'Assistant'}
                          </span>
                        </div>
                        <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                        <div className={`text-xs mt-2 flex items-center gap-2 ${
                          message.role === 'user' || message.source === 'admin'
                            ? 'text-white opacity-75'
                            : 'text-gray-500'
                        }`}>
                          <span>🕐</span>
                          <span>{formatTimestamp(message.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={conversationEndRef} />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>No conversation history available</p>
                </div>
              )}
            </div>

            {/* Quick Reply Section (Desktop) */}
            <div className="hidden lg:block border-t border-gray-200 p-4 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a quick response... (Ctrl+Enter to send)"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !adminMessage.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm flex items-center gap-2"
                >
                  {sendingMessage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <span>Send</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Actions & Info Panel */}
          <div className={`w-full lg:w-96 bg-gray-50 border-l border-gray-200 overflow-y-auto ${
            showMobileActions ? 'block' : 'hidden lg:block'
          }`}>
            <div className="p-4 sm:p-6 space-y-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>⚡</span>
                Admin Actions
              </h3>
              
              {/* Admin Message */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>💬</span>
                  Send Message as Admin
                </label>
                <textarea
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Type your response to the customer..."
                  disabled={sendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !adminMessage.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg mt-3 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  {sendingMessage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Message
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  💡 Tip: Press Ctrl+Enter to send quickly
                </p>
              </div>

              {/* Resolution */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>✅</span>
                  Resolution Notes
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Describe how this issue was resolved..."
                />
                <button
                  onClick={handleResolve}
                  disabled={!resolutionNotes.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg mt-3 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Resolve & Close Chat
                </button>
              </div>

              {/* Chat Info */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>ℹ️</span>
                  Chat Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600 min-w-[80px]">Session:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 break-all">{chat.sessionId}</code>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600 min-w-[80px]">Customer:</span>
                    <span className="text-gray-900">{chat.customerId?.name || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600 min-w-[80px]">Email:</span>
                    <span className="text-gray-900">{chat.customerId?.email || 'Not provided'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600 min-w-[80px]">Reason:</span>
                    <span className="text-gray-900 font-medium">{chat.reason}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600 min-w-[80px]">Created:</span>
                    <span className="text-gray-900">{formatTimestamp(chat.createdAt)}</span>
                  </div>
                  {chat.assignedAdmin && (
                    <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="font-medium text-blue-700 min-w-[80px]">Assigned:</span>
                      <span className="text-blue-900 font-semibold">{chat.assignedAdmin.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              {chat.fullDetails?.adminNotes && chat.fullDetails.adminNotes.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>📝</span>
                    Admin Notes ({chat.fullDetails.adminNotes.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {chat.fullDetails.adminNotes.map((note, index) => (
                      <div key={index} className="text-xs bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900">
                            {note.adminId?.name || 'System'}
                          </span>
                          <span className="text-gray-500">
                            {formatTimestamp(note.timestamp)}
                          </span>
                        </div>
                        <div className="text-gray-700">{note.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-in {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default ChatDetailsModal;