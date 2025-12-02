import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const DocumentationLanding = ({ onNavigateToAuth }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: '👥',
      title: 'Member Management',
      description: 'Comprehensive member registration, profile management, and membership tracking with advanced search capabilities.',
      highlights: ['Digital registration', 'Profile management', 'Advanced search', 'Status tracking']
    },
    {
      icon: '💰',
      title: 'Payment Processing',
      description: 'Automated fee collection, payment history, and financial reporting with multiple payment method support.',
      highlights: ['Automated billing', 'Multiple payment methods', 'Financial reports', 'Payment history']
    },
    {
      icon: '📊',
      title: 'Attendance Tracking',
      description: 'Real-time attendance monitoring with biometric integration and detailed analytics dashboard.',
      highlights: ['Real-time tracking', 'Biometric integration', 'Analytics dashboard', 'Member timeline']
    },
    {
      icon: '📈',
      title: 'Analytics & Reports',
      description: 'Advanced reporting system with customizable charts, trends analysis, and export capabilities.',
      highlights: ['Custom reports', 'Data visualization', 'Trend analysis', 'Export options']
    },
    {
      icon: '⚙️',
      title: 'System Settings',
      description: 'Flexible configuration options, user role management, and system customization tools.',
      highlights: ['Role management', 'Custom settings', 'System config', 'Admin controls']
    },
    {
      icon: '🔒',
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with role-based access control and data encryption.',
      highlights: ['Data encryption', 'Access control', 'Audit logs', 'Secure backups']
    }
  ];

  const quickStart = [
    { 
      step: 1, 
      title: 'Create Account', 
      description: 'Sign up and create your administrator account',
      time: '2 min',
      icon: '🚀'
    },
    { 
      step: 2, 
      title: 'Initial Setup', 
      description: 'Configure your library settings and preferences',
      time: '5 min',
      icon: '⚙️'
    },
    { 
      step: 3, 
      title: 'Add Members', 
      description: 'Import or add your first library members',
      time: '10 min',
      icon: '👥'
    },
    { 
      step: 4, 
      title: 'Start Managing', 
      description: 'Begin tracking attendance, payments, and activities',
      time: '5 min',
      icon: '📊'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Library Director',
      organization: 'City Public Library',
      content: 'LibraryOS has transformed how we manage our daily operations. The automation features save us hours every day.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'IT Administrator',
      organization: 'University Library System',
      content: 'The biometric integration and reporting capabilities are exactly what we needed. Setup was surprisingly simple.',
      rating: 5
    },
    {
      name: 'Emma Rodriguez',
      role: 'Operations Manager',
      organization: 'Community Reading Center',
      content: 'Outstanding support and feature set. Our member satisfaction has increased significantly since implementation.',
      rating: 5
    }
  ];

  const techSpecs = [
    { category: 'Platform', details: ['Web-based application', 'Cross-platform compatibility', 'Mobile responsive design'] },
    { category: 'Security', details: ['SSL/TLS encryption', 'Role-based access control', 'Regular security updates'] },
    { category: 'Integration', details: ['Biometric device support', 'Payment gateway integration', 'Export/Import capabilities'] },
    { category: 'Performance', details: ['99.9% uptime guarantee', 'Fast loading times', 'Scalable architecture'] }
  ];

  const tabContent = {
    overview: (
      <div className="doc-content">
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-text">🎉 New Version Available</span>
              <span className="badge-version">v2.1.0</span>
            </div>
            <h1 className="hero-title">
              The Complete
              <br />
              <span className="gradient-text">Library Management</span>
              <br />
              Platform
            </h1>
            <p className="hero-description">
              Streamline your library operations with our comprehensive digital solution. 
              From member management to advanced analytics, everything you need to run 
              a modern library efficiently.
            </p>
            <div className="hero-actions">
              <button 
                className="btn-hero-primary"
                onClick={() => onNavigateToAuth('signup')}
              >
                <span>Start Free Trial</span>
                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button 
                className="btn-hero-secondary"
                onClick={() => setActiveTab('features')}
              >
                <span>View Features</span>
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">Active Libraries</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">15K+</div>
                <div className="stat-label">Members Managed</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Uptime SLA</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">4.9/5</div>
                <div className="stat-label">User Rating</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="features-showcase">
          <div className="section-header">
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-description">
              Powerful features designed specifically for modern library management
            </p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card-enhanced">
                <div className="feature-header">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3 className="feature-title">{feature.title}</h3>
                </div>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-highlights">
                  {feature.highlights.map((highlight, idx) => (
                    <span key={idx} className="feature-highlight">{highlight}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="testimonials-section">
          <div className="section-header">
            <h2 className="section-title">Trusted by Libraries Worldwide</h2>
            <p className="section-description">
              See what library professionals are saying about LibraryOS
            </p>
          </div>
          
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="star">⭐</span>
                  ))}
                </div>
                <p className="testimonial-content">"{testimonial.content}"</p>
                <div className="testimonial-author">
                  <div className="author-info">
                    <div className="author-name">{testimonial.name}</div>
                    <div className="author-role">{testimonial.role}</div>
                    <div className="author-org">{testimonial.organization}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    
    features: (
      <div className="doc-content">
        <div className="features-hero">
          <div className="section-header">
            <h2 className="section-title">Complete Feature Breakdown</h2>
            <p className="section-description">
              Explore the comprehensive set of tools designed to modernize your library operations
            </p>
          </div>
        </div>

        <div className="features-detailed">
          <div className="feature-category">
            <div className="category-header">
              <div className="category-icon">👥</div>
              <div>
                <h3 className="category-title">Member Management</h3>
                <p className="category-subtitle">Complete member lifecycle management</p>
              </div>
            </div>
            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-item-icon">✨</div>
                <div>
                  <h4>Digital Registration</h4>
                  <p>Streamlined online registration with document uploads and verification</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-item-icon">🔍</div>
                <div>
                  <h4>Advanced Search</h4>
                  <p>Powerful search and filtering across all member data points</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-item-icon">📋</div>
                <div>
                  <h4>Profile Management</h4>
                  <p>Comprehensive member profiles with history and preferences</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-item-icon">🔄</div>
                <div>
                  <h4>Status Tracking</h4>
                  <p>Real-time membership status and renewal management</p>
                </div>
              </div>
            </div>
          </div>

          <div className="feature-category">
            <div className="category-header">
              <div className="category-icon">💰</div>
              <div>
                <h3 className="category-title">Payment & Billing</h3>
                <p className="category-subtitle">Automated financial management</p>
              </div>
            </div>
            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-item-icon">🤖</div>
                <div>
                  <h4>Automated Billing</h4>
                  <p>Smart fee calculation with automated invoice generation</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-item-icon">💳</div>
                <div>
                  <h4>Multiple Payment Methods</h4>
                  <p>Support for cash, card, online, and mobile payments</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-item-icon">📊</div>
                <div>
                  <h4>Financial Reports</h4>
                  <p>Comprehensive revenue tracking and financial analytics</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-item-icon">⏰</div>
                <div>
                  <h4>Overdue Management</h4>
                  <p>Automated reminders and overdue payment tracking</p>
                </div>
              </div>
            </div>
          </div>

          <div className="feature-category">
            <div className="category-header">
              <div className="category-icon">📊</div>
              <div>
                <h3 className="category-title">Attendance & Analytics</h3>
                <p className="category-subtitle">Real-time tracking and insights</p>
              </div>
            </div>
            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-item-icon">⚡</div>
                <div>
                  <h4>Real-time Tracking</h4>
                  <p>Live attendance monitoring with instant updates</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-item-icon">👆</div>
                <div>
                  <h4>Biometric Integration</h4>
                  <p>Seamless integration with fingerprint and facial recognition</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-item-icon">📈</div>
                <div>
                  <h4>Advanced Analytics</h4>
                  <p>Detailed insights into member behavior and library usage</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-item-icon">📋</div>
                <div>
                  <h4>Custom Reports</h4>
                  <p>Generate tailored reports for any time period or criteria</p>
                </div>
              </div>
            </div>
          </div>

          <div className="feature-category">
            <div className="category-header">
              <div className="category-icon">⚙️</div>
              <div>
                <h3 className="category-title">System Administration</h3>
                <p className="category-subtitle">Complete control and customization</p>
              </div>
            </div>
            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-item-icon">👨‍💼</div>
                <div>
                  <h4>Role Management</h4>
                  <p>Flexible user roles and permission management</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-item-icon">🎨</div>
                <div>
                  <h4>Custom Settings</h4>
                  <p>Tailor the system to match your library's workflow</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-item-icon">🔒</div>
                <div>
                  <h4>Security Controls</h4>
                  <p>Advanced security features and audit trails</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-item-icon">🔄</div>
                <div>
                  <h4>Data Management</h4>
                  <p>Import, export, and backup capabilities</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="tech-specs-section">
          <div className="section-header">
            <h3 className="section-title">Technical Specifications</h3>
            <p className="section-description">Built with modern technology for reliability and performance</p>
          </div>
          
          <div className="tech-specs-grid">
            {techSpecs.map((spec, index) => (
              <div key={index} className="tech-spec-card">
                <h4 className="spec-title">{spec.category}</h4>
                <ul className="spec-list">
                  {spec.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    
    quickStart: (
      <div className="doc-content">
        <div className="quickstart-hero">
          <div className="section-header">
            <h2 className="section-title">Get Started in Minutes</h2>
            <p className="section-description">
              Follow our simple 4-step process to get your library management system up and running
            </p>
            <div className="total-time-badge">
              <span className="time-icon">⏱️</span>
              <span>Total setup time: ~22 minutes</span>
            </div>
          </div>
        </div>

        <div className="quick-start-timeline">
          {quickStart.map((step, index) => (
            <div key={index} className="timeline-step">
              <div className="timeline-connector">
                <div className="step-circle">
                  <span className="step-icon">{step.icon}</span>
                  <span className="step-number">{step.step}</span>
                </div>
                {index < quickStart.length - 1 && <div className="connector-line"></div>}
              </div>
              <div className="step-content">
                <div className="step-header">
                  <h3 className="step-title">{step.title}</h3>
                  <div className="step-time">
                    <span className="time-badge">{step.time}</span>
                  </div>
                </div>
                <p className="step-description">{step.description}</p>
                <div className="step-details">
                  {step.step === 1 && (
                    <div className="detail-list">
                      <div className="detail-item">
                        <span className="detail-icon">📧</span>
                        <span>Provide email and create password</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">✅</span>
                        <span>Verify email address</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🏢</span>
                        <span>Enter library information</span>
                      </div>
                    </div>
                  )}
                  {step.step === 2 && (
                    <div className="detail-list">
                      <div className="detail-item">
                        <span className="detail-icon">🎨</span>
                        <span>Customize library branding</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">💰</span>
                        <span>Set fee structures</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">⏰</span>
                        <span>Configure operating hours</span>
                      </div>
                    </div>
                  )}
                  {step.step === 3 && (
                    <div className="detail-list">
                      <div className="detail-item">
                        <span className="detail-icon">📁</span>
                        <span>Import from CSV/Excel</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">✍️</span>
                        <span>Manual registration</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📸</span>
                        <span>Add photos and documents</span>
                      </div>
                    </div>
                  )}
                  {step.step === 4 && (
                    <div className="detail-list">
                      <div className="detail-item">
                        <span className="detail-icon">📊</span>
                        <span>Set up dashboard</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🔔</span>
                        <span>Configure notifications</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🚀</span>
                        <span>Go live with your system</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="getting-started-cta">
          <div className="cta-card">
            <div className="cta-content">
              <h3>Ready to Transform Your Library?</h3>
              <p>Join over 500 libraries worldwide who have already modernized their operations with LibraryOS.</p>
              
              <div className="cta-features">
                <div className="cta-feature">
                  <span className="cta-feature-icon">🆓</span>
                  <span>14-day free trial</span>
                </div>
                <div className="cta-feature">
                  <span className="cta-feature-icon">💳</span>
                  <span>No credit card required</span>
                </div>
                <div className="cta-feature">
                  <span className="cta-feature-icon">📞</span>
                  <span>Free setup assistance</span>
                </div>
                <div className="cta-feature">
                  <span className="cta-feature-icon">📚</span>
                  <span>Complete documentation</span>
                </div>
              </div>
              
              <div className="cta-actions">
                <button 
                  className="btn-cta-primary"
                  onClick={() => onNavigateToAuth('signup')}
                >
                  <span>Start Free Trial</span>
                  <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button 
                  className="btn-cta-secondary"
                  onClick={() => onNavigateToAuth('login')}
                >
                  <span>Already have an account? Sign In</span>
                </button>
              </div>
            </div>
            
            <div className="cta-testimonial">
              <div className="testimonial-quote">
                "The setup was incredibly smooth. We were up and running in less than 30 minutes!"
              </div>
              <div className="testimonial-author">
                <strong>Jennifer Walsh</strong>, Head Librarian at Metro Library
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className="documentation-landing">
      {/* Navigation Header */}
      <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-brand">
            <div className="brand-logo">
              <span className="brand-icon">📚</span>
              <div className="brand-text-container">
                <span className="brand-text">LibraryOS</span>
                <span className="brand-tagline">Management Platform</span>
              </div>
            </div>
          </div>
          
          <div className="nav-menu">
            <button 
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`nav-link ${activeTab === 'features' ? 'active' : ''}`}
              onClick={() => setActiveTab('features')}
            >
              Features
            </button>
            <button 
              className={`nav-link ${activeTab === 'quickStart' ? 'active' : ''}`}
              onClick={() => setActiveTab('quickStart')}
            >
              Quick Start
            </button>
          </div>
          
          <div className="nav-actions">
            {!isAuthenticated && (
              <>
                <button 
                  className="nav-button nav-button-ghost"
                  onClick={() => onNavigateToAuth('login')}
                >
                  <span>Sign In</span>
                </button>
                <button 
                  className="nav-button nav-button-primary"
                  onClick={() => onNavigateToAuth('signup')}
                >
                  <span>Get Started</span>
                  <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>



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
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="brand-icon">📚</span>
                <span className="brand-text">LibraryOS</span>
              </div>
              <p className="footer-description">
                The complete library management platform trusted by institutions worldwide.
                Streamline operations, enhance member experience, and drive growth.
              </p>
              <div className="footer-social">
                <span className="social-link">🐦 Twitter</span>
                <span className="social-link">📘 LinkedIn</span>
                <span className="social-link">📧 Email</span>
              </div>
            </div>
            
            <div className="footer-links">
              <div className="footer-column">
                <h5>Product</h5>
                <ul>
                  <li><button onClick={() => setActiveTab('features')}>Features</button></li>
                  <li><button onClick={() => setActiveTab('quickStart')}>Quick Start</button></li>
                  <li>Pricing</li>
                  <li>Updates</li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h5>Resources</h5>
                <ul>
                  <li>Documentation</li>
                  <li>API Reference</li>
                  <li>Tutorials</li>
                  <li>Best Practices</li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h5>Support</h5>
                <ul>
                  <li>Help Center</li>
                  <li>Community</li>
                  <li>Contact Us</li>
                  <li>System Status</li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h5>Company</h5>
                <ul>
                  <li>About Us</li>
                  <li>Blog</li>
                  <li>Careers</li>
                  <li>Privacy Policy</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <p>&copy; 2025 LibraryOS. All rights reserved.</p>
              <div className="footer-bottom-links">
                <span>Terms of Service</span>
                <span>Privacy Policy</span>
                <span>Security</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DocumentationLanding;
