import React, { useState } from 'react';
import { adminAPI } from '../../utils/api';

const ChatDetailsModal = ({ chat, onClose, onResolve, onAssign }) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const handleSendMessage = async () => {
    if (!adminMessage.trim()) return;
    
    setSendingMessage(true);
    try {
      console.log('🛠️ Sending admin message:', adminMessage);
      const response = await adminAPI.sendAdminMessage(chat.sessionId, adminMessage);
      
      if (response.data.success) {
        console.log('✅ Admin message sent successfully');
        setAdminMessage('');
        // Refresh the chat data to show the new message
        onClose(); // Close and reopen to refresh
        setTimeout(() => {
          // This would typically trigger a refresh of the chat data
          window.location.reload(); // Simple refresh for demo
        }, 1000);
      } else {
        console.error('❌ Failed to send admin message');
        alert('Failed to send message');
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
    await onResolve(chat._id, resolutionNotes);
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[priority]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800'
    };
    const labels = {
      pending: 'PENDING',
      in_progress: 'IN PROGRESS',
      resolved: 'RESOLVED'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Chat Details - Escalated Conversation
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-2 flex items-center space-x-4">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
              Session: {chat.sessionId.substring(0, 8)}...
            </span>
            {getPriorityBadge(chat.priority)}
            {getStatusBadge(chat.status)}
            {chat.customerId && (
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                Customer: {chat.customerId.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex h-[calc(90vh-200px)]">
          {/* Conversation */}
          <div className="flex-1 border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversation History</h3>
              <div className="space-y-4">
                {chat.conversation?.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.role === 'system'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : message.source === 'admin'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}
                    >
                      <div className="text-sm">{message.content}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {formatTimestamp(message.timestamp)}
                        {message.source && ` • ${message.source}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions & Info */}
          <div className="w-96 bg-gray-50 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h3>
            
            {/* Admin Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send Message as Admin
              </label>
              <textarea
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                rows="3"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Type your response to the customer..."
                disabled={sendingMessage}
              />
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !adminMessage.trim()}
                className="w-full bg-blue-600 text-white py-2 rounded-md mt-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            </div>

            {/* Resolution */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Notes
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows="3"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Add resolution notes before closing..."
              />
              <button
                onClick={handleResolve}
                disabled={!resolutionNotes.trim()}
                className="w-full bg-green-600 text-white py-2 rounded-md mt-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resolve Chat
              </button>
            </div>

            {/* Chat Info */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Chat Information</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Session ID:</span>{' '}
                  <code className="text-xs">{chat.sessionId}</code>
                </div>
                <div>
                  <span className="font-medium">Customer:</span>{' '}
                  {chat.customerId?.name || 'Anonymous'}
                </div>
                <div>
                  <span className="font-medium">Email:</span>{' '}
                  {chat.customerId?.email || 'Not provided'}
                </div>
                <div>
                  <span className="font-medium">Reason:</span>{' '}
                  {chat.reason}
                </div>
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {formatTimestamp(chat.createdAt)}
                </div>
                {chat.assignedAdmin && (
                  <div>
                    <span className="font-medium">Assigned to:</span>{' '}
                    {chat.assignedAdmin.name}
                  </div>
                )}
              </div>
            </div>

            {/* Admin Notes */}
            {chat.fullDetails?.adminNotes && chat.fullDetails.adminNotes.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Admin Notes</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {chat.fullDetails.adminNotes.map((note, index) => (
                    <div key={index} className="text-xs bg-white p-2 rounded border">
                      <div className="font-medium">{note.adminId?.name || 'System'}</div>
                      <div>{note.note}</div>
                      <div className="text-gray-500 text-xs">
                        {formatTimestamp(note.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatDetailsModal;