import { useState, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import NotificationContainer from './components/NotificationContainer';
import './styles/globals.css';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Members = lazy(() => import('./pages/Members'));
const Payments = lazy(() => import('./pages/Payments'));
const Expenditures = lazy(() => import('./pages/Expenditures'));
const Attendance = lazy(() => import('./pages/Attendance.jsx'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

// Loading Fallback
const PageLoader = () => (
  <div className="loading" style={{ height: '100%', minHeight: '400px' }}>
    <div className="loading-spinner" />
  </div>
);

// Main App Content
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageProps, setPageProps] = useState({});

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

  const handlePageChange = (page, props = {}) => {
    setCurrentPage(page);
    setPageProps(props);
  };

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
      <Suspense fallback={<PageLoader />}>
        {renderPage()}
      </Suspense>
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
