import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children, currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    { id: 'expenditures', label: 'Expenditures', icon: '💸' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  // Listen for menu actions from main process
  useEffect(() => {
    if (window.api?.menu?.onAction) {
      const cleanup = window.api.menu.onAction((action) => {
        switch (action) {
          case 'new-member':
            onPageChange('members', { action: 'new' });
            break;
          case 'new-expenditure':
            onPageChange('expenditures', { action: 'new' });
            break;
          case 'settings':
            onPageChange('settings');
            break;
          case 'attendance-report':
            onPageChange('reports', { tab: 'attendance' });
            break;
          case 'payment-report':
            onPageChange('reports', { tab: 'payments' });
            break;
          case 'members-report':
            onPageChange('reports', { tab: 'members' });
            break;
        }
      });

      return cleanup;
    }
  }, [onPageChange]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar - Fixed position */}
      <aside
        style={{
          width: sidebarOpen ? '250px' : '70px',
          backgroundColor: '#2d3748',
          color: 'white',
          transition: 'width 0.3s ease',
          flexShrink: 0,
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1000,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        <div style={{ padding: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '2rem'
          }}>
            <span style={{ fontSize: '1.5rem' }}>📚</span>
            {sidebarOpen && (
              <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                Library MS
              </span>
            )}
          </div>

          <nav>
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  marginBottom: '0.25rem',
                  backgroundColor: currentPage === item.id ? '#4a5568' : 'transparent',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  transition: 'background-color 0.2s'
                }}
              >
                <span>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ 
          position: 'absolute', 
          bottom: '1rem', 
          left: '1rem', 
          right: sidebarOpen ? '1rem' : '0.5rem',
          width: sidebarOpen ? 'calc(100% - 2rem)' : 'calc(100% - 1rem)'
        }}>
          {sidebarOpen && (
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#a0aec0', 
              marginBottom: '1rem' 
            }}>
              Logged in as: {user?.fullName || user?.username}
            </div>
          )}
          <button
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              gap: sidebarOpen ? '0.75rem' : '0',
              padding: '0.75rem',
              backgroundColor: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content - Offset by sidebar width */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        marginLeft: sidebarOpen ? '250px' : '70px',
        transition: 'margin-left 0.3s ease',
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Header - Fixed at top */}
        <header style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 1.5rem',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              ☰
            </button>
            <h1 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#2d3748',
              textTransform: 'capitalize' 
            }}>
              {currentPage}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#718096' }}>
              {new Date().toLocaleDateString()}
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#3182ce',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              {(user?.fullName || user?.username)?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content - Scrollable area */}
        <main style={{ 
          flex: 1, 
          padding: '1.5rem', 
          overflow: 'auto',
          backgroundColor: '#f7fafc',
          height: 'calc(100vh - 60px)'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
