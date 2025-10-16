import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ChatInterface from './components/chat/ChatInterface';
import AdminDashboard from './components/admin/AdminDashboard';

// Component to handle session-specific chat with UUID in URL
const SessionChat = () => {
  const { sessionId } = useParams();
  return <ChatInterface sessionId={sessionId} />;
};

const AppContent = () => {
  const { user, loading, logout } = useAuth();
  const [authMode, setAuthMode] = useState('login');
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return authMode === 'login' ? (
      <Login onToggleMode={() => setAuthMode('register')} />
    ) : (
      <Register onToggleMode={() => setAuthMode('login')} />
    );
  }

  const isAdminUser = user.role === 'admin' || user.role === 'support_agent';

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                AI Customer Support
              </h1>
              {isAdminUser && (
                <div className="ml-8 flex space-x-4">
                  <button
                    onClick={() => handleNavigation('/')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      window.location.pathname === '/'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    💬 Customer Chat
                  </button>
                  <button
                    onClick={() => handleNavigation('/admin')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      window.location.pathname === '/admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🚨 Admin Dashboard
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user.name}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                user.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800'
                  : user.role === 'support_agent'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user.role}
              </span>
              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/" element={<ChatInterface />} />
          <Route path="/:sessionId" element={<SessionChat />} />
          <Route path="/admin" element={isAdminUser ? <AdminDashboard /> : <ChatInterface />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;