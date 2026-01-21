import React, { useEffect, useState } from 'react';
import { storeSocialAuth, getGitHubUser } from './utils/socialAuth';

export default function GitHubCallback() {
  const [status, setStatus] = useState('Processing GitHub authentication...');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (!code) {
          setError('No authorization code received');
          return;
        }

        // Exchange code for access token via backend
        // Note: For production, implement a secure backend endpoint
        const response = await fetch('/api/auth/github/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state })
        });

        if (!response.ok) {
          throw new Error('Failed to exchange code for token');
        }

        const { accessToken } = await response.json();

        // Get user info
        const user = await getGitHubUser(accessToken);

        // Store auth data
        storeSocialAuth('github', {
          accessToken,
          user: {
            username: user.login,
            name: user.name,
            avatar: user.avatar_url,
            url: user.html_url
          }
        });

        setStatus('✓ GitHub connected successfully!');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (err) {
        console.error('GitHub callback error:', err);
        setError(err.message || 'Authentication failed');
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>GitHub Authentication</h2>
      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <p>{status}</p>
      )}
    </div>
  );
}
