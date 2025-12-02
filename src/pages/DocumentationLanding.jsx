import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const DocumentationLanding = ({ onNavigateToAuth }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: '👥',
      title: 'Member Management',
      description: 'Comprehensive member registration, profile management, and membership tracking with advanced search capabilities.'
    },
    {
      icon: '💰',
      title: 'Payment Processing',
      description: 'Automated fee collection, payment history, and financial reporting with multiple payment method support.'
    },
    {
      icon: '📊',
      title: 'Attendance Tracking',
      description: 'Real-time attendance monitoring with biometric integration and detailed analytics dashboard.'
    },
    {
      icon: '📈',
      title: 'Analytics & Reports',
      description: 'Advanced reporting system with customizable charts, trends analysis, and export capabilities.'
    },
    {
      icon: '⚙️',
      title: 'System Settings',
      description: 'Flexible configuration options, user role management, and system customization tools.'
    },
    {
      icon: '🔒',
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with role-based access control and data encryption.'
    }
  ];

  const quickStart = [
    { step: 1, title: 'Sign Up', description: 'Create your administrator account to get started' },
    { step: 2, title: 'Initial Setup', description: 'Configure your library settings and preferences' },
    { step: 3, title: 'Add Members', description: 'Start adding library members and their details' },
    { step: 4, title: 'Track Activity', description: 'Monitor attendance, payments, and generate reports' }
  ];

  const tabContent = {
    overview: (
      <div className="doc-content">
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="gradient-text">Library Management</span>
              <br />Made Simple & Powerful
            </h1>
            <p className="hero-description">
              A comprehensive digital solution designed to streamline library operations, 
              enhance member experience, and provide powerful analytics for modern libraries.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">500+</span>
                <span className="stat-label">Libraries</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Members</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">99.9%</span>
                <span className="stat-label">Uptime</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card" data-aos="fade-up" data-aos-delay={index * 100}>
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    ),
    
    features: (
      <div className="doc-content">
        <h2 className="section-title">Comprehensive Feature Set</h2>
        <div className="features-detailed">
          <div className="feature-section">
            <h3>📋 Member Management</h3>
            <ul>
              <li>Digital member registration and profile management</li>
              <li>Advanced search and filtering capabilities</li>
              <li>Membership status tracking and renewals</li>
              <li>Photo ID and document management</li>
            </ul>
          </div>
          
          <div className="feature-section">
            <h3>💳 Payment & Billing</h3>
            <ul>
              <li>Automated fee calculation and invoicing</li>
              <li>Multiple payment method support</li>
              <li>Payment history and receipt generation</li>
              <li>Overdue payment tracking and notifications</li>
            </ul>
          </div>
          
          <div className="feature-section">
            <h3>👤 Attendance System</h3>
            <ul>
              <li>Real-time check-in/check-out tracking</li>
              <li>Biometric integration support</li>
              <li>Attendance reports and analytics</li>
              <li>Member activity timeline</li>
            </ul>
          </div>
          
          <div className="feature-section">
            <h3>📊 Reports & Analytics</h3>
            <ul>
              <li>Comprehensive dashboard with key metrics</li>
              <li>Customizable report generation</li>
              <li>Revenue and expenditure tracking</li>
              <li>Member engagement analytics</li>
            </ul>
          </div>
        </div>
      </div>
    ),
    
    quickStart: (
      <div className="doc-content">
        <h2 className="section-title">Quick Start Guide</h2>
        <div className="quick-start-steps">
          {quickStart.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-number">{step.step}</div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="getting-started-actions">
          <div className="action-card">
            <h3>Ready to get started?</h3>
            <p>Join thousands of libraries already using our platform to streamline their operations.</p>
            <div className="action-buttons">
              <button 
                className="button button-primary button-large"
                onClick={() => onNavigateToAuth('signup')}
              >
                Create Account
              </button>
              <button 
                className="button button-secondary button-large"
                onClick={() => onNavigateToAuth('login')}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className="documentation-landing">
      {/* Navigation Header */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="brand-icon">📚</span>
            <span className="brand-text">LibraryOS</span>
          </div>
          
          <div className="nav-actions">
            {!isAuthenticated && (
              <>
                <button 
                  className="nav-button nav-button-ghost"
                  onClick={() => onNavigateToAuth('login')}
                >
                  Sign In
                </button>
                <button 
                  className="nav-button nav-button-primary"
                  onClick={() => onNavigateToAuth('signup')}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <div className="tab-container">
          {['overview', 'features', 'quickStart'].map((tab) => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'overview' ? 'Overview' : 
               tab === 'features' ? 'Features' : 'Quick Start'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="landing-main">
        <div className="content-container">
          {tabContent[activeTab]}
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>LibraryOS</h4>
              <p>Modern library management made simple and powerful.</p>
            </div>
            <div className="footer-section">
              <h5>Features</h5>
              <ul>
                <li>Member Management</li>
                <li>Payment Processing</li>
                <li>Attendance Tracking</li>
                <li>Analytics & Reports</li>
              </ul>
            </div>
            <div className="footer-section">
              <h5>Support</h5>
              <ul>
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Community</li>
                <li>Contact Us</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 LibraryOS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DocumentationLanding;
