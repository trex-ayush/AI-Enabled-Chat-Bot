import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import ChatDetailsModal from './ChatDetailsModal';

const EscalatedChats = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all'
  });
  const [selectedChat, setSelectedChat] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadEscalatedChats();
  }, [filters]);

  const loadEscalatedChats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getEscalatedChats(filters);
      if (response.data.success) {
        setChats(response.data.data.chats);
      }
    } catch (error) {
      console.error('Failed to load escalated chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAdmin = async (chatId, adminId) => {
    try {
      await adminAPI.assignAdminToChat(chatId, adminId);
      loadEscalatedChats(); // Refresh the list
    } catch (error) {
      console.error('Failed to assign admin:', error);
    }
  };

  const handleResolveChat = async (chatId, resolutionNotes) => {
    try {
      await adminAPI.resolveChat(chatId, resolutionNotes);
      loadEscalatedChats(); // Refresh the list
      setShowModal(false);
    } catch (error) {
      console.error('Failed to resolve chat:', error);
    }
  };

  const openChatDetails = async (chat) => {
    try {
      const response = await adminAPI.getChatDetails(chat._id);
      if (response.data.success) {
        setSelectedChat({
          ...chat,
          conversation: response.data.data.conversation,
          fullDetails: response.data.data.chat
        });
        setShowModal(true);
      }
    } catch (error) {
      console.error('Failed to load chat details:', error);
    }
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
      pending: 'Pending',
      in_progress: 'In Progress',
      resolved: 'Resolved'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">Loading escalated chats...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadEscalatedChats}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Chats List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Escalated Chats ({chats.length})
          </h2>
        </div>
        
        {chats.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🚨</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No escalated chats</h3>
            <p className="text-gray-500">All clear! No chats require human intervention.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {chats.map((chat) => (
              <div key={chat._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        {chat.customerId?.name || 'Anonymous User'}
                      </h3>
                      {getPriorityBadge(chat.priority)}
                      {getStatusBadge(chat.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {chat.reason}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Created: {new Date(chat.createdAt).toLocaleDateString()}</span>
                      {chat.assignedAdmin && (
                        <span>Assigned to: {chat.assignedAdmin.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openChatDetails(chat)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      View Details
                    </button>
                    {chat.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolveChat(chat._id, 'Resolved via admin panel')}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Details Modal */}
      {showModal && selectedChat && (
        <ChatDetailsModal
          chat={selectedChat}
          onClose={() => setShowModal(false)}
          onResolve={handleResolveChat}
          onAssign={handleAssignAdmin}
        />
      )}
    </div>
  );
};

export default EscalatedChats;