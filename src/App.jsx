import { useState, Suspense, lazy, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LoginPage from './components/LoginPage';
import DiagnosticPage from './components/DiagnosticPage';
import Layout from './components/Layout';
import NotificationContainer from './components/NotificationContainer';
import InitialSetup from './pages/InitialSetup';
import DocumentationLanding from './pages/DocumentationLanding';
import OnboardingSetup from './components/OnboardingSetup';
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
  const { isAuthenticated, loading, setupCompleted, checkingSetup } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageProps, setPageProps] = useState({});
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);
  const [showDocumentation, setShowDocumentation] = useState(!isAuthenticated);
  const [authMode, setAuthMode] = useState(null); // 'login' or 'signup'

  // Simple routing
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      setShowDocumentation(false);
      setAuthMode(null);
    }
  }, [isAuthenticated]);

  const handleNavigateToAuth = (mode) => {
    setAuthMode(mode);
    setShowDocumentation(false);
  };

  const handleBackToDocumentation = () => {
    setShowDocumentation(true);
    setAuthMode(null);
  };

  const handleSetupComplete = () => {
    // Setup completed, navigate to dashboard
    setCurrentPage('dashboard');
  };

  if (loading || checkingSetup) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        Loading application...
      </div>
    );
  }

  // Show diagnostic page regardless of auth status
  if (currentRoute === '/diagnostic') {
    return <DiagnosticPage />;
  }

  // Show initial setup page regardless of auth status
  if (currentRoute === '/setup' || currentRoute === '/initial-setup') {
    return <InitialSetup />;
  }

  // Show documentation landing page when not authenticated and no specific auth mode
  if (!isAuthenticated && showDocumentation && !authMode) {
    return <DocumentationLanding onNavigateToAuth={handleNavigateToAuth} />;
  }

  // Show login/signup page when not authenticated and auth mode is set
  if (!isAuthenticated) {
    return <LoginPage 
      initialMode={authMode} 
      onBackToDocumentation={handleBackToDocumentation} 
    />;
  }

  // Show onboarding setup if authenticated but setup not completed
  if (isAuthenticated && !setupCompleted) {
    return <OnboardingSetup onComplete={handleSetupComplete} />;
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
