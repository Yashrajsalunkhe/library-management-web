import { useState, useEffect, createContext, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear stored authentication on app start to always show login page
    localStorage.removeItem('library_user');
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const result = await api.auth.login(credentials);
      if (result.success) {
        setUser(result.user);
        localStorage.setItem('library_user', JSON.stringify(result.user));
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('library_user');
  };

  const requestPasswordChangeOTP = async (data) => {
    try {
      const result = await api.auth.requestPasswordChangeOTP(data);
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const changePassword = async (data) => {
    try {
      const result = await api.auth.changePassword(data);
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const changeUsername = async (data) => {
    try {
      const result = await api.auth.changeUsername(data);
      if (result.success) {
        // Update user context with new username
        const updatedUser = { ...user, username: data.newUsername };
        setUser(updatedUser);
        localStorage.setItem('library_user', JSON.stringify(updatedUser));
      }
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const value = {
    user,
    login,
    logout,
    requestPasswordChangeOTP,
    changePassword,
    changeUsername,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
