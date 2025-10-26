import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import SessionManager from './components/common/SessionManager';
import NotificationContainer from './components/common/NotificationContainer';
import NetworkStatus from './components/common/NetworkStatus';
import GlobalErrorHandler from './components/common/GlobalErrorHandler';
import { backendWarmer } from './utils/backendWarmer';

// Pages
import SignupPage from './pages/SignupPage';
import SigninPage from './pages/SigninPage';
import ChatPage from './pages/ChatPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  // Warm up backend on app start
  useEffect(() => {
    backendWarmer.autoWarm().catch(error => {
      console.warn('Backend auto-warming failed:', error.message);
    });
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <NotificationProvider>
          <AuthProvider>
            <SocketProvider>
              <GlobalErrorHandler />
              <SessionManager>
                <div className="app">
                  <NotificationContainer />
                  <NetworkStatus />
                  
                  <Routes>
                    {/* Public routes - only accessible when not authenticated */}
                    <Route 
                      path="/signup" 
                      element={
                        <PublicRoute>
                          <SignupPage />
                        </PublicRoute>
                      } 
                    />
                    <Route 
                      path="/signin" 
                      element={
                        <PublicRoute>
                          <SigninPage />
                        </PublicRoute>
                      } 
                    />
                    
                    {/* Protected routes - only accessible when authenticated */}
                    <Route 
                      path="/chat" 
                      element={
                        <ProtectedRoute>
                          <ChatPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Redirect root to appropriate page */}
                    <Route 
                      path="/" 
                      element={<Navigate to="/signin" replace />} 
                    />
                    
                    {/* 404 page */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </div>
              </SessionManager>
            </SocketProvider>
          </AuthProvider>
        </NotificationProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;