import React from 'react';

const DashboardStats = ({ stats }) => {
  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Sessions',
      value: stats.sessions.total,
      icon: '💬',
      color: 'blue',
      description: 'All customer sessions'
    },
    {
      title: 'Active Escalations',
      value: stats.escalatedChats.pending + stats.escalatedChats.inProgress,
      icon: '🚨',
      color: 'red',
      description: 'Requiring human intervention'
    },
    {
      title: 'High Priority',
      value: stats.escalatedChats.highPriority,
      icon: '⚠️',
      color: 'orange',
      description: 'Urgent escalations'
    },
    {
      title: 'Resolved Today',
      value: stats.escalatedChats.resolved,
      icon: '✅',
      color: 'green',
      description: 'Recently resolved'
    },
    {
      title: 'Total Users',
      value: stats.users.total,
      icon: '👥',
      color: 'purple',
      description: 'Registered users'
    },
    {
      title: 'Admin Users',
      value: stats.users.admins,
      icon: '🛡️',
      color: 'indigo',
      description: 'Admin & support agents'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      red: 'bg-red-50 border-red-200 text-red-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getColorClasses(stat.color)}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-75">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs opacity-75 mt-1">{stat.description}</p>
                </div>
                <div className="text-3xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Sessions</span>
              <span className="font-semibold">{stats.sessions.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Escalated Sessions</span>
              <span className="font-semibold text-yellow-600">{stats.sessions.escalated}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Resolved Sessions</span>
              <span className="font-semibold text-green-600">{stats.sessions.resolved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Recent Sessions (7 days)</span>
              <span className="font-semibold">{stats.sessions.recent}</span>
            </div>
          </div>
        </div>

        {/* Escalation Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Escalation Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Escalations</span>
              <span className="font-semibold text-red-600">{stats.escalatedChats.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">In Progress</span>
              <span className="font-semibold text-blue-600">{stats.escalatedChats.inProgress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Resolved Escalations</span>
              <span className="font-semibold text-green-600">{stats.escalatedChats.resolved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Recent Escalations (7 days)</span>
              <span className="font-semibold">{stats.escalatedChats.recent}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">
                <strong>{stats.sessions.recent}</strong> new sessions in last 7 days
              </span>
            </div>
            <span className="text-xs text-gray-500">Active</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">
                <strong>{stats.escalatedChats.recent}</strong> new escalations in last 7 days
              </span>
            </div>
            <span className="text-xs text-gray-500">Monitoring</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">
                <strong>{stats.escalatedChats.resolved}</strong> chats resolved recently
              </span>
            </div>
            <span className="text-xs text-gray-500">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;