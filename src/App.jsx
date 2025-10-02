import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import NotificationContainer from './components/NotificationContainer';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Payments from './pages/Payments';
import Expenditures from './pages/Expenditures';
import Attendance from './pages/Attendance.jsx';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import './styles/globals.css';

// Main App Content
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageProps, setPageProps] = useState({});
  const [apiReady, setApiReady] = useState(false);

  // Check if Electron API is available
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50; // Reduce max attempts from infinite to 50 (5 seconds)
    
    const checkApi = () => {
      attempts++;
      if (typeof window !== 'undefined' && window.api) {
        setApiReady(true);
        console.log('Electron API is ready');
      } else if (attempts >= maxAttempts) {
        // If API not available after 5 seconds, continue anyway (might be running in browser)
        console.warn('Electron API not found after 5 seconds, continuing without it');
        setApiReady(true);
      } else {
        console.log(`Checking for Electron API (${attempts}/${maxAttempts})...`);
        setTimeout(checkApi, 100);
      }
    };
    checkApi();
  }, []);

  const handlePageChange = (page, props = {}) => {
    setCurrentPage(page);
    setPageProps(props);
  };

  // Show loading while API is not ready
  if (!apiReady) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: '#f5f7fa'
      }}>
        <div style={{
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '300px'
        }}>
          <div className="loading-spinner" style={{ 
            width: '40px', 
            height: '40px',
            margin: '0 auto 1rem auto'
          }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>
            Library Management System
          </h3>
          <p style={{ color: '#718096', fontSize: '0.875rem' }}>
            Initializing application...
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        Loading application...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'members':
        return <Members initialAction={pageProps} />;
      case 'payments':
        return <Payments />;
      case 'expenditures':
        return <Expenditures initialAction={pageProps} />;
      case 'attendance':
        return <Attendance />;
      case 'reports':
        return <Reports initialTab={pageProps} />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="card text-center">
            <h2>Page Under Construction</h2>
            <p>The {currentPage} page is coming soon!</p>
            <button 
              onClick={() => handlePageChange('dashboard')} 
              className="button button-primary mt-4"
            >
              Back to Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={handlePageChange}>
      {renderPage()}
    </Layout>
  );
};

// Main App Component
export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="app">
          <AppContent />
          <NotificationContainer />
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
}
