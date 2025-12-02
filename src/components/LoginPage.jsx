import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import './LoginPage.css';

const LoginPage = ({ initialMode = null, onBackToDocumentation = null }) => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(initialMode === 'signup');
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    username: '',
    fullName: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, signUp } = useAuth();
  const { error, success } = useNotification();

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signUp(credentials);
      if (result.success) {
        success('Account created successfully! Please check your email to verify your account.');
        setIsRightPanelActive(false);
      } else {
        console.error('Sign up failed:', result.message);
        error(result.message || 'Sign up failed');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      error(`Error: ${err.message || 'An unexpected error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(credentials);
      if (!result.success) {
        console.error('Login failed:', result.message);
        error(result.message || 'Login failed');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      error(`Error: ${err.message || 'An unexpected error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  useEffect(() => {
    if (initialMode === 'signup') {
      setIsRightPanelActive(true);
    } else if (initialMode === 'login') {
      setIsRightPanelActive(false);
    }
  }, [initialMode]);

  return (
    <div className="login-page-wrapper">
      {onBackToDocumentation && (
        <button
          type="button"
          onClick={onBackToDocumentation}
          className="back-to-docs-button"
        >
          ← Back to Documentation
        </button>
      )}

      <div className={`container ${isRightPanelActive ? 'right-panel-active' : ''}`} id="container">
        <div className="form-container sign-up-container">
          <form onSubmit={handleSignUpSubmit}>
            <h1>Create Account</h1>
            <div className="social-container">
              <a href="#" className="social"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a>
              <a href="#" className="social"><i className="fab fa-linkedin-in"></i></a>
            </div>
            <span>or use your email for registration</span>
            <input 
              type="text" 
              placeholder="Name" 
              name="fullName"
              value={credentials.fullName}
              onChange={handleChange}
              required
              autoComplete="name"
            />
            <input 
              type="email" 
              placeholder="Email" 
              name="email"
              value={credentials.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
            <input 
              type="password" 
              placeholder="Password" 
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        </div>
        
        <div className="form-container sign-in-container">
          <form onSubmit={handleSignInSubmit}>
            <h1>Sign in</h1>
            <div className="social-container">
              <a href="#" className="social"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a>
              <a href="#" className="social"><i className="fab fa-linkedin-in"></i></a>
            </div>
            <span>or use your account</span>
            <input 
              type="email" 
              placeholder="Email" 
              name="email"
              value={credentials.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
            <input 
              type="password" 
              placeholder="Password" 
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
            <a href="#">Forgot your password?</a>
            <button type="submit" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
        
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button className="ghost" onClick={() => setIsRightPanelActive(false)}>
                Sign In
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start journey with us</p>
              <button className="ghost" onClick={() => setIsRightPanelActive(true)}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
