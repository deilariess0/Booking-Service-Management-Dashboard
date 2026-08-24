import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LoginPage from './loginpages/LoginPage';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  
  // Check for token before rendering. If missing, redirect to login.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Optional but recommended: Handle the case where a logged-in user visits /login
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  
  // If user is already logged in, send them straight to the dashboard
  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Protect the login page from already logged-in users */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        
        {/* Logout route simply clears the token and redirects to login (handled in App.jsx as well) */}
        <Route path="/logout" element={<Navigate to="/login" replace />} />
        
        {/* Protect the entire dashboard App */}
        <Route path="/*" element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);