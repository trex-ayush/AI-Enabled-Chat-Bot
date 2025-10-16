import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { supportAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

// Custom component for rendering markdown with Tailwind styling
const MarkdownMessage = ({ content }) => {
  return (
    <div className="text-sm prose prose-sm max-w-none prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-strong:font-semibold prose-em:italic">
      <ReactMarkdown
        components={{
          // Customize heading styles
          h1: ({ node, ...props }) => <h1 className="text-lg font-semibold mt-4 mb-2 text-gray-900" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-base font-semibold mt-3 mb-2 text-gray-900" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-gray-900" {...props} />,
          // Customize list styles
          ul: ({ node, ...props }) => <ul className="list-disc ml-4 space-y-1 mt-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal ml-4 space-y-1 mt-2" {...props} />,
          li: ({ node, ...props }) => <li className="text-gray-700" {...props} />,
          // Customize paragraph and text
          p: ({ node, ...props }) => <p className="my-2 text-gray-800" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-gray-800" {...props} />,
          // Customize code blocks
          code: ({ node, inline, ...props }) => 
            inline ? 
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} /> :
              <code className="block bg-gray-100 p-2 rounded text-sm font-mono my-2" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const ChatInterface = ({ sessionId: propSessionId }) => {
  const { sessionId: urlSessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(propSessionId || urlSessionId || null);
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (urlSessionId || propSessionId) {
      loadExistingSession(urlSessionId || propSessionId);
    } else {
      generateSessionId();
    }
    
    if (user) {
      loadChatHistory();
    }
  }, [user, urlSessionId, propSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateSessionId = async () => {
    try {
      console.log('🆕 Generating session ID (not creating in DB yet)');
      const response = await supportAPI.createSession();
      if (response.data.success) {
        const newSessionId = response.data.sessionId;
        setSessionId(newSessionId);
        
        setMessages([{
          role: 'assistant',
          content: 'Hello! How can I help you with your customer support questions today?',
          timestamp: new Date(),
        }]);
        
        if (!urlSessionId) {
          navigate(`/${newSessionId}`, { replace: true });
        }
        
        console.log('✅ Session ID generated:', newSessionId);
      }
    } catch (error) {
      console.error('Failed to generate session ID:', error);
    }
  };

  const loadExistingSession = async (existingSessionId) => {
    try {
      setLoading(true);
      console.log('🔄 Loading existing session:', existingSessionId);
      
      let response;
      if (user) {
        try {
          response = await supportAPI.getUserSession(existingSessionId);
        } catch (error) {
          response = await supportAPI.getSessionHistory(existingSessionId);
        }
      } else {
        response = await supportAPI.getSessionHistory(existingSessionId);
      }
      
      if (response.data.success) {
        const sessionData = response.data.data?.session || response.data;
        setSessionId(existingSessionId);
        setMessages(sessionData.conversation || []);
        setHasSentFirstMessage(true);
        console.log('✅ Existing session loaded');
      } else {
        throw new Error('Failed to load session');
      }
    } catch (error) {
      console.error('Failed to load existing session:', error);
      await generateSessionId();
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = async () => {
    if (!user) return;
    
    try {
      setHistoryLoading(true);
      console.log('📚 Loading chat history for user...');
      const response = await supportAPI.getUserChats();
      if (response.data.success) {
        console.log('✅ Chat history loaded:', response.data.data.sessions.length, 'sessions');
        setChatHistory(response.data.data.sessions);
      } else {
        console.log('❌ Failed to load chat history');
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadSession = async (targetSessionId) => {
    try {
      setLoading(true);
      console.log('🔍 Loading session:', targetSessionId);
      
      navigate(`/${targetSessionId}`);
      
      if (user) {
        const response = await supportAPI.getUserSession(targetSessionId);
        if (response.data.success) {
          setSessionId(targetSessionId);
          setMessages(response.data.data.session.conversation);
          setHasSentFirstMessage(true);
          setShowHistory(false);
          console.log('✅ Session loaded successfully');
        }
      } else {
        setSessionId(targetSessionId);
        setHasSentFirstMessage(true);
        await loadExistingSession(targetSessionId);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = async () => {
    console.log('🆕 Starting new chat...');
    setSessionId(null);
    setMessages([]);
    setHasSentFirstMessage(false);
    setShowHistory(false);
    await generateSessionId();
    
    if (user) {
      setTimeout(() => loadChatHistory(), 1000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newUserMessage]);

    try {
      console.log('💬 Sending message to session:', sessionId);
      const response = await supportAPI.sendMessage(sessionId, userMessage);
      
      if (response.data.success) {
        const aiMessage = {
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date(),
          source: response.data.source,
          status: response.data.status,
          needsEscalation: response.data.needsEscalation,
        };
        setMessages(prev => [...prev, aiMessage]);
        setHasSentFirstMessage(true);

        if (response.data.needsEscalation) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'system',
              content: 'Your conversation has been escalated to a human agent. Please wait for assistance.',
              timestamp: new Date(),
            }]);
          }, 1000);
        }

        if (user) {
          console.log('🔄 Refreshing chat history after message...');
          setTimeout(() => loadChatHistory(), 500);
        }
      } else {
        console.log('❌ Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };


  return (
    <div className="flex h-screen bg-gray-50">
      {/* History Sidebar */}
      {user && (
        <div className={`${showHistory ? 'w-80' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden`}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <button
              onClick={startNewChat}
              className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              + New Chat
            </button>
            
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Loading history...</span>
              </div>
            ) : chatHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p>No chat history yet</p>
                <p className="text-sm mt-2">Start a conversation to see it here!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {chatHistory.map((session) => (
                  <div
                    key={session.sessionId}
                    onClick={() => loadSession(session.sessionId)}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-gray-50 border ${
                      sessionId === session.sessionId ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {session.title || 'Untitled Chat'}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        session.status === 'resolved' 
                          ? 'bg-green-100 text-green-800'
                          : session.status === 'escalated'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {session.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(session.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI Customer Support</h1>
              <p className="text-sm text-gray-600">We're here to help you 24/7</p>
              {sessionId && (
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs text-gray-500">
                    Session: {sessionId.substring(0, 8)}...
                    {!hasSentFirstMessage && (
                      <span className="text-orange-500 ml-1">(Not saved yet)</span>
                    )}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {user && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  {showHistory ? 'Hide History' : 'Show History'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.role === 'system'
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      : message.source === 'admin'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                  }`}
                >
                  {message.role === 'user' ? (
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <MarkdownMessage content={message.content} />
                  )}
                  {message.source && (
                    <div className="text-xs opacity-70 mt-2">
                      Source: {message.source}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your customer support question here..."
                disabled={loading}
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !inputMessage.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
            {!hasSentFirstMessage && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Send your first message to save this conversation
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ChatInterface;