import { useState, useEffect, createContext, useContext } from 'react';

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
      const result = await window.api.auth.login(credentials);
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
      const result = await window.api.auth.requestPasswordChangeOTP(data);
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const changePassword = async (data) => {
    try {
      const result = await window.api.auth.changePassword(data);
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
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
