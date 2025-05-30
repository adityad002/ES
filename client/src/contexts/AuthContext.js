import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    // Clear existing authentication for demo purposes
    // Comment this line out if you want to preserve login sessions
    localStorage.removeItem('auth_token');
    
    const checkLoggedIn = async () => {
      try {
        // Check if we have a token in localStorage
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        // Verify token by fetching user data
        const response = await authService.getProfile();
        
        if (response.data.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          // Clear invalid token
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('auth_token');
        setError('Authentication failed. Please log in again.');
      } finally {
        setIsLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.login({ email, password });
      
      if (response.data.success) {
        localStorage.setItem('auth_token', response.data.token);
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        setError(response.data.message || 'Login failed');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Login error details:', error);
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name, email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.register({ name, email, password });
      
      if (response.data.success) {
        return { success: true };
      } else {
        setError(response.data.message || 'Registration failed');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Registration error details:', error);
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 