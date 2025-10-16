import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
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
      const response = await adminAPI.sendAdminMessage(chat.sessionId, adminMessage);
      
      if (response.data.success) {
        setAdminMessage('');
        showNotification('Message sent successfully!', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending admin message:', error);
      showNotification(error.response?.data?.error || 'Failed to send message', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      showNotification('Please add resolution notes', 'warning');
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

  const showNotification = (message, type = 'info') => {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    };
    
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-[60] animate-slide-in-right flex items-center gap-2`;
    notification.innerHTML = `
      <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
      <span>${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slide-out-right 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      high: { 
        bg: 'bg-red-50', 
        border: 'border-red-300',
        text: 'text-red-700', 
        icon: '🔴',
        label: 'HIGH PRIORITY'
      },
      medium: { 
        bg: 'bg-yellow-50', 
        border: 'border-yellow-300',
        text: 'text-yellow-700', 
        icon: '🟡',
        label: 'MEDIUM'
      },
      low: { 
        bg: 'bg-green-50', 
        border: 'border-green-300',
        text: 'text-green-700', 
        icon: '🟢',
        label: 'LOW'
      }
    };
    return configs[priority] || configs.low;
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        bg: 'bg-yellow-50', 
        border: 'border-yellow-300',
        text: 'text-yellow-700', 
        icon: '⏳',
        label: 'PENDING'
      },
      in_progress: { 
        bg: 'bg-blue-50', 
        border: 'border-blue-300',
        text: 'text-blue-700', 
        icon: '🔄',
        label: 'IN PROGRESS'
      },
      resolved: { 
        bg: 'bg-green-50', 
        border: 'border-green-300',
        text: 'text-green-700', 
        icon: '✅',
        label: 'RESOLVED'
      }
    };
    return configs[status] || configs.pending;
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

  const getMessageConfig = (role, source) => {
    if (source === 'admin') {
      return {
        icon: '👨‍💼',
        label: 'Admin',
        bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
        textColor: 'text-white',
        align: 'left',
        avatar: 'bg-purple-600'
      };
    }
    if (role === 'user') {
      return {
        icon: '👤',
        label: 'Customer',
        bgColor: 'bg-gradient-to-br from-blue-600 to-blue-700',
        textColor: 'text-white',
        align: 'right',
        avatar: 'bg-blue-600'
      };
    }
    if (role === 'system') {
      return {
        icon: '⚠️',
        label: 'System',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-900',
        border: 'border-2 border-yellow-200',
        align: 'left',
        avatar: 'bg-yellow-500'
      };
    }
    return {
      icon: '🤖',
      label: 'AI Assistant',
      bgColor: 'bg-white',
      textColor: 'text-gray-800',
      border: 'border-2 border-gray-200',
      align: 'left',
      avatar: 'bg-gray-600'
    };
  };

  const priorityConfig = getPriorityConfig(chat.priority);
  const statusConfig = getStatusConfig(chat.status);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  💬
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    Escalated Chat Details
                  </h2>
                  <p className="text-xs text-gray-600">Review and respond to escalated conversation</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-mono font-bold shadow-sm">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                  </svg>
                  {chat.sessionId.substring(0, 12)}...
                </span>
                
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 ${priorityConfig.bg} ${priorityConfig.border} ${priorityConfig.text}`}>
                  <span>{priorityConfig.icon}</span>
                  {priorityConfig.label}
                </span>
                
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text}`}>
                  <span>{statusConfig.icon}</span>
                  {statusConfig.label}
                </span>
                
                {chat.customerId && (
                  <span className="inline-flex items-center gap-1.5 bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                    </svg>
                    {chat.customerId.name}
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Actions Toggle */}
        <div className="lg:hidden border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <button
            onClick={() => setShowMobileActions(!showMobileActions)}
            className="w-full px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-white flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <span>⚡</span>
              Admin Actions & Information
            </span>
            <svg 
              className={`w-5 h-5 transition-transform duration-300 ${showMobileActions ? 'rotate-180' : ''}`} 
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
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="max-w-4xl mx-auto">
                <div className="sticky top-0 bg-gradient-to-br from-gray-50 to-gray-100 pb-4 mb-6 z-10">
                  <div className="flex items-center gap-2 text-gray-900">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                      💬
                    </div>
                    <h3 className="text-base sm:text-lg font-bold">Conversation History</h3>
                    <span className="ml-auto bg-white px-3 py-1 rounded-full text-xs font-semibold text-gray-600 shadow-sm">
                      {chat.conversation?.length || 0} messages
                    </span>
                  </div>
                </div>
                
                {chat.conversation && chat.conversation.length > 0 ? (
                  <div className="space-y-6">
                    {chat.conversation.map((message, index) => {
                      const config = getMessageConfig(message.role, message.source);
                      const isUser = message.role === 'user';
                      
                      return (
                        <div
                          key={index}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-in`}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <div className={`flex gap-3 max-w-[85%] sm:max-w-2xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`flex-shrink-0 w-9 h-9 ${config.avatar} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
                              <span className="text-sm">{config.icon}</span>
                            </div>
                            
                            {/* Message Content */}
                            <div className="flex-1 min-w-0">
                              <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                <span className={`text-xs font-bold ${isUser ? 'text-blue-700' : 'text-gray-700'}`}>
                                  {config.label}
                                </span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                                  </svg>
                                  {formatTimestamp(message.timestamp)}
                                </span>
                              </div>
                              
                              <div
                                className={`px-4 py-3 rounded-2xl shadow-md ${config.bgColor} ${config.textColor} ${config.border || ''} ${
                                  isUser ? 'rounded-br-md' : 'rounded-bl-md'
                                }`}
                              >
                                <div className="prose prose-sm max-w-none">
                                  <ReactMarkdown
                                    components={{
                                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                                      li: ({node, ...props}) => <li className="ml-2" {...props} />,
                                      code: ({node, inline, ...props}) => 
                                        inline ? (
                                          <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                                            isUser || message.source === 'admin' 
                                              ? 'bg-white bg-opacity-20' 
                                              : 'bg-gray-100'
                                          }`} {...props} />
                                        ) : (
                                          <code className={`block p-3 rounded-lg text-xs font-mono overflow-x-auto ${
                                            isUser || message.source === 'admin'
                                              ? 'bg-white bg-opacity-20'
                                              : 'bg-gray-100'
                                          }`} {...props} />
                                        ),
                                      strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                                      em: ({node, ...props}) => <em className="italic" {...props} />,
                                      a: ({node, ...props}) => (
                                        <a 
                                          className={`underline ${
                                            isUser || message.source === 'admin'
                                              ? 'text-white hover:text-gray-200'
                                              : 'text-blue-600 hover:text-blue-800'
                                          }`} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          {...props} 
                                        />
                                      ),
                                    }}
                                  >
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={conversationEndRef} />
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Messages Yet</h3>
                    <p className="text-gray-500">The conversation history is empty</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Reply Section (Desktop) */}
            <div className="hidden lg:block border-t border-gray-200 p-4 bg-white shadow-lg">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={adminMessage}
                      onChange={(e) => setAdminMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a quick response... (Ctrl+Enter to send)"
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                      rows="2"
                      disabled={sendingMessage}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                      <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd>
                    </div>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !adminMessage.trim()}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    {sendingMessage ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions & Info Panel */}
          <div className={`w-full lg:w-[400px] bg-gradient-to-br from-gray-50 to-gray-100 border-l border-gray-200 overflow-y-auto ${
            showMobileActions ? 'block' : 'hidden lg:block'
          }`}>
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white">
                  ⚡
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Admin Actions</h3>
              </div>
              
              {/* Admin Message */}
              <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center text-white text-sm">
                    💬
                  </div>
                  <label className="text-sm font-bold text-gray-900">
                    Send Admin Message
                  </label>
                </div>
                <textarea
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows="5"
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-all"
                  placeholder="Type your response to the customer...&#10;&#10;You can use Markdown for formatting:&#10;**bold**, *italic*, lists, etc."
                  disabled={sendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !adminMessage.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl mt-3 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {sendingMessage ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Send Message</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center flex items-center justify-center gap-1">
                  <span>💡</span>
                  <span>Supports Markdown • Ctrl+Enter to send</span>
                </p>
              </div>

              {/* Resolution */}
              <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm">
                    ✅
                  </div>
                  <label className="text-sm font-bold text-gray-900">
                    Resolution Notes
                  </label>
                </div>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows="5"
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-all"
                  placeholder="Describe how this issue was resolved...&#10;&#10;Include:&#10;• Actions taken&#10;• Solution provided&#10;• Follow-up needed"
                />
                <button
                  onClick={handleResolve}
                  disabled={!resolutionNotes.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl mt-3 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Resolve & Close Chat</span>
                </button>
              </div>

              {/* Chat Info */}
              <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">
                    ℹ️
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Chat Information</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-600 text-xs uppercase tracking-wider">Session ID</span>
                    <code className="text-xs bg-gray-100 px-3 py-2 rounded-lg font-mono break-all border border-gray-200">{chat.sessionId}</code>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-600 text-xs uppercase tracking-wider">Customer</span>
                    <span className="text-gray-900 font-medium">{chat.customerId?.name || 'Anonymous User'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-600 text-xs uppercase tracking-wider">Email</span>
                    <span className="text-gray-900 font-medium">{chat.customerId?.email || 'Not provided'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-600 text-xs uppercase tracking-wider">Escalation Reason</span>
                    <span className="text-gray-900 font-semibold bg-red-50 px-3 py-2 rounded-lg border border-red-200">{chat.reason}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-600 text-xs uppercase tracking-wider">Created</span>
                    <span className="text-gray-900">{formatTimestamp(chat.createdAt)}</span>
                  </div>
                  {chat.assignedAdmin && (
                    <div className="flex flex-col gap-1 p-3 bg-blue-50 rounded-xl border-2 border-blue-200">
                      <span className="font-semibold text-blue-700 text-xs uppercase tracking-wider">Assigned To</span>
                      <span className="text-blue-900 font-bold">{chat.assignedAdmin.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              {chat.fullDetails?.adminNotes && chat.fullDetails.adminNotes.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-white text-sm">
                      📝
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Admin Notes ({chat.fullDetails.adminNotes.length})
                    </h4>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                    {chat.fullDetails.adminNotes.map((note, index) => (
                      <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-gray-900 text-sm">
                            {note.adminId?.name || 'System'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(note.timestamp)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed">{note.note}</div>
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
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-out-right {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
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
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default ChatDetailsModal;