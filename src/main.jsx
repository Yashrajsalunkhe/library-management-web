// Entry point for React frontend
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// Error boundary to catch and display any loading errors
const ErrorBoundary = ({ children }) => {
  try {
    return children;
  } catch (error) {
    console.error('Error in React app:', error);
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h2>Application Error</h2>
        <p>There was an error loading the application.</p>
        <p style={{ fontSize: '0.875rem', color: '#666' }}>
          {error.message}
        </p>
        <button onClick={() => window.location.reload()}>
          Reload Application
        </button>
      </div>
    );
  }
};

try {
  const root = createRoot(document.getElementById('root'));
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to render React app:', error);
  // Fallback: show error message directly in the DOM
  document.getElementById('root').innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 1rem; padding: 2rem; text-align: center;">
      <h2>Failed to Load Application</h2>
      <p>There was an error starting the React application.</p>
      <p style="font-size: 0.875rem; color: #666;">${error.message}</p>
      <button onclick="window.location.reload()">Reload</button>
    </div>
  `;
}
