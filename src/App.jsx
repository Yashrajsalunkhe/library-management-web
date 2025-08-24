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
    const checkApi = () => {
      if (typeof window !== 'undefined' && window.api) {
        setApiReady(true);
        console.log('Electron API is ready');
      } else {
        console.log('Electron API not ready, retrying...');
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
        gap: '1rem'
      }}>
        <div className="loading-spinner" />
        <p>Loading Electron API...</p>
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
        return <Expenditures />;
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
