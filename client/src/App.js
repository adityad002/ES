import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout components
import Header from './components/Header';
import Sidebar from './components/Sidebar';

// Pages
import HomePage from './pages/HomePage';
import FeaturesPage from './pages/FeaturesPage';
import ContactPage from './pages/ContactPage';
import ManualPage from './pages/ManualPage';
import Dashboard from './pages/Dashboard';
import TimetablePage from './pages/TimetablePage';
import TeachersPage from './pages/TeachersPage';
import SubjectsPage from './pages/SubjectsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

// Context
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

import './App.css';

// Layout component that conditionally renders Header and Sidebar
function Layout({ children, isHomePage = false }) {
  const { isAuthenticated } = useContext(AuthContext);
  
  // If it's the home page, don't use the app layout
  if (isHomePage) {
    return children;
  }
  
  return (
    <div className="app-container">
      {isAuthenticated && <Header />}
      <div className="main-content">
        {isAuthenticated && <Sidebar />}
        <div className={isAuthenticated ? "content-area" : "full-width-content"}>
          {children}
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated } = useContext(AuthContext);
  
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={
          <Layout isHomePage={true}>
            <HomePage />
          </Layout>
        } />
        
        {/* Public feature page */}
        <Route path="/features" element={
          <Layout isHomePage={true}>
            <FeaturesPage />
          </Layout>
        } />
        
        {/* Public contact page */}
        <Route path="/contact" element={
          <Layout isHomePage={true}>
            <ContactPage />
          </Layout>
        } />
        
        {/* Public user manual page */}
        <Route path="/manual" element={
          <Layout isHomePage={true}>
            <ManualPage />
          </Layout>
        } />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <Layout>
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          </Layout>
        } />
        <Route path="/timetable" element={
          <Layout>
            <PrivateRoute>
              <TimetablePage />
            </PrivateRoute>
          </Layout>
        } />
        <Route path="/teachers" element={
          <Layout>
            <PrivateRoute>
              <TeachersPage />
            </PrivateRoute>
          </Layout>
        } />
        <Route path="/subjects" element={
          <Layout>
            <PrivateRoute>
              <SubjectsPage />
            </PrivateRoute>
          </Layout>
        } />
        <Route path="/settings" element={
          <Layout>
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          </Layout>
        } />
        
        {/* Auth routes */}
        <Route path="/login" element={
          <Layout>
            <LoginPage />
          </Layout>
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={
          <Layout>
            <NotFoundPage />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 