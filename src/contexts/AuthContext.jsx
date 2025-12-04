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
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(false);

  useEffect(() => {
    // Restore user session from localStorage and Supabase on app start
    const restoreSession = async () => {
      try {
        // Check Supabase session first
        const { data: { session } } = await api.auth.getSession();
        
        if (session?.user) {
          // Get full profile details
          const profileResult = await api.profiles.get(session.user.id);
          
          if (profileResult.success && profileResult.data) {
            setUser(profileResult.data);
            localStorage.setItem('library_user', JSON.stringify(profileResult.data));
            await checkSetupStatus();
          } else {
            // Try localStorage as fallback
            const storedUser = localStorage.getItem('library_user');
            if (storedUser) {
              setUser(JSON.parse(storedUser));
              await checkSetupStatus();
            }
          }
        } else {
          // No Supabase session, check localStorage
          const storedUser = localStorage.getItem('library_user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            await checkSetupStatus();
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        // Try localStorage as final fallback
        const storedUser = localStorage.getItem('library_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
            await checkSetupStatus();
          } catch (e) {
            console.error('Error parsing stored user:', e);
            localStorage.removeItem('library_user');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const checkSetupStatus = async () => {
    try {
      setCheckingSetup(true);
      const result = await api.checkSetupStatus();
      setSetupCompleted(result.setupCompleted || false);
      return result.setupCompleted || false;
    } catch (error) {
      console.error('Error checking setup status:', error);
      setSetupCompleted(false);
      return false;
    } finally {
      setCheckingSetup(false);
    }
  };

  const markSetupCompleted = async () => {
    try {
      await api.markSetupCompleted();
      setSetupCompleted(true);
      return { success: true };
    } catch (error) {
      console.error('Error marking setup as completed:', error);
      return { success: false, message: error.message };
    }
  };

  const login = async (credentials) => {
    try {
      const result = await api.auth.login(credentials);
      if (result.success) {
        setUser(result.user);
        localStorage.setItem('library_user', JSON.stringify(result.user));
        // Check setup status after successful login
        await checkSetupStatus();
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('AuthContext login error:', error);
      
      // Handle different types of errors
      let userMessage = error.message;
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
        userMessage = 'Unable to connect to the authentication service. Please check your internet connection or try again later.';
      } else if (error.message.includes('network')) {
        userMessage = 'Network error occurred. Please try again.';
      }
      
      return { success: false, message: userMessage };
    }
  };

  const signUp = async (credentials) => {
    try {
      const result = await api.auth.signUp(credentials);
      return result;
    } catch (error) {
      console.error('AuthContext signUp error:', error);
      
      // Handle different types of errors
      let userMessage = error.message;
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
        userMessage = 'Unable to connect to the authentication service. Please check your internet connection or try again later.';
      } else if (error.message.includes('network')) {
        userMessage = 'Network error occurred. Please try again.';
      }
      
      return { success: false, message: userMessage };
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
    signUp,
    logout,
    requestPasswordChangeOTP,
    changePassword,
    changeUsername,
    checkSetupStatus,
    markSetupCompleted,
    loading,
    checkingSetup,
    setupCompleted,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
