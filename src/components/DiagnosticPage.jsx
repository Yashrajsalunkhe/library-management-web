import { useState } from 'react';
import { testSupabaseConnection } from '../lib/supabase';

const DiagnosticPage = () => {
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const runTest = async () => {
    setTesting(true);
    try {
      const result = await testSupabaseConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Test failed',
        message: error.message
      });
    }
    setTesting(false);
  };

  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 
      import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 
      'undefined'
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔍 Supabase Connection Diagnostics</h1>
      
      <div style={{ 
        background: '#f5f5f5', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '2rem' 
      }}>
        <h3>Environment Variables</h3>
        <div style={{ fontFamily: 'monospace' }}>
          <div>VITE_SUPABASE_URL: <strong>{envVars.VITE_SUPABASE_URL || 'undefined'}</strong></div>
          <div>VITE_SUPABASE_ANON_KEY: <strong>{envVars.VITE_SUPABASE_ANON_KEY}</strong></div>
        </div>
      </div>

      <button 
        onClick={runTest}
        disabled={testing}
        style={{
          background: testing ? '#ccc' : '#007acc',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '4px',
          cursor: testing ? 'not-allowed' : 'pointer',
          marginBottom: '1rem'
        }}
      >
        {testing ? '🔄 Testing...' : '🚀 Test Supabase Connection'}
      </button>

      {testResult && (
        <div style={{
          background: testResult.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${testResult.success ? '#c3e6cb' : '#f5c6cb'}`,
          color: testResult.success ? '#155724' : '#721c24',
          padding: '1rem',
          borderRadius: '4px',
          marginTop: '1rem'
        }}>
          <h4>{testResult.success ? '✅ Success' : '❌ Failed'}</h4>
          <p><strong>Message:</strong> {testResult.message}</p>
          {testResult.error && <p><strong>Error:</strong> {testResult.error}</p>}
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h3>🔧 Troubleshooting Steps</h3>
        <ol>
          <li>
            <strong>Check Environment Variables:</strong> Make sure your <code>.env</code> file contains valid 
            <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>
          </li>
          <li>
            <strong>Verify Supabase Project:</strong> Log into your Supabase dashboard and ensure your project is active
          </li>
          <li>
            <strong>Network Issues:</strong> The error suggests DNS resolution issues. Your Supabase project might be:
            <ul>
              <li>Paused due to inactivity</li>
              <li>Deleted</li>
              <li>Using an incorrect URL</li>
            </ul>
          </li>
          <li>
            <strong>Create New Project:</strong> If the project is deleted, create a new one at 
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer"> supabase.com</a>
          </li>
        </ol>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>📋 Current Issues Detected</h3>
        <div style={{ background: '#fff3cd', border: '1px solid #ffeaa7', padding: '1rem', borderRadius: '4px' }}>
          <p>⚠️ <strong>ERR_NAME_NOT_RESOLVED:</strong> The domain <code>pymvqkhwtvncwgtjesbk.supabase.co</code> cannot be resolved</p>
          <p>This typically means the Supabase project no longer exists or has been paused.</p>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPage;
