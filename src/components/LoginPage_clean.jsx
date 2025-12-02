import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    username: '',
    fullName: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, signUp } = useAuth();
  const { error, success } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp(credentials);
        if (result.success) {
          success('Account created successfully! Please check your email to verify your account.');
          setIsSignUp(false);
        } else {
          console.error('Sign up failed:', result.message);
          error(result.message || 'Sign up failed');
        }
      } else {
        const result = await login(credentials);
        if (!result.success) {
          console.error('Login failed:', result.message);
          error(result.message || 'Login failed');
        }
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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem',
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)'
      }}>
        <div className="text-center mb-4">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <h1 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem' }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600">
            {isSignUp ? 'Create your Library Management System account' : 'Sign in to Library Management System'}
          </p>
        </div>

        <div className="flex mb-6" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '4px' }}>
          <button
            type="button"
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              isSignUp 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setIsSignUp(true)}
          >
            Create Account
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              !isSignUp 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setIsSignUp(false)}
          >
            Sign In
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="input"
                  value={credentials.fullName}
                  onChange={handleChange}
                  required
                  autoFocus
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="input"
                  value={credentials.username}
                  onChange={handleChange}
                  required
                  placeholder="Choose a username"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              {isSignUp ? 'Email' : 'Email/Username'}
            </label>
            <input
              id="email"
              name="email"
              type={isSignUp ? "email" : "text"}
              className="input"
              value={credentials.email}
              onChange={handleChange}
              required
              autoFocus={!isSignUp}
              placeholder={isSignUp ? "Enter your email address" : "Enter your email or username"}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              value={credentials.password}
              onChange={handleChange}
              required
              placeholder={isSignUp ? "Create a secure password" : "Enter your password"}
            />
          </div>

          <button
            type="submit"
            className="button button-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.875rem' }}
            disabled={loading}
          >
            {loading && <div className="loading-spinner" style={{ width: '16px', height: '16px', borderTopColor: 'white' }} />}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-4 text-sm text-gray-600">
          {isSignUp ? (
            <p>Already have an account? <button type="button" className="text-blue-600 hover:text-blue-800" onClick={() => setIsSignUp(false)}>Sign in here</button></p>
          ) : (
            <p>Don't have an account? <button type="button" className="text-blue-600 hover:text-blue-800" onClick={() => setIsSignUp(true)}>Create one here</button></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
