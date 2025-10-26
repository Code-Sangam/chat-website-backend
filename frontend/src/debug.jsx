import React from 'react';

function Debug() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug Info</h1>
      <p><strong>API URL:</strong> {import.meta.env.VITE_API_URL || 'NOT SET'}</p>
      <p><strong>Socket URL:</strong> {import.meta.env.VITE_SOCKET_URL || 'NOT SET'}</p>
      <p><strong>Mode:</strong> {import.meta.env.MODE}</p>
      <p><strong>Environment:</strong> {import.meta.env.NODE_ENV}</p>
      
      <h2>Test API Connection</h2>
      <button onClick={async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://chat-website-backend-3d1p.onrender.com/api'}/health`);
          const data = await response.json();
          console.log('API Response:', data);
          alert('API Response: ' + JSON.stringify(data));
        } catch (error) {
          console.error('API Error:', error);
          alert('API Error: ' + error.message);
        }
      }}>
        Test API Connection
      </button>
    </div>
  );
}

export default Debug;