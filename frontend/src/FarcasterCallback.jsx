import React, { useEffect, useState } from 'react';
import { storeSocialAuth, getFarcasterUser } from './utils/socialAuth';

export default function FarcasterCallback() {
  const [status, setStatus] = useState('Processing Farcaster authentication...');
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
        const response = await fetch('/api/auth/farcaster/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state })
        });

        if (!response.ok) {
          throw new Error('Failed to exchange code for token');
        }

        const { accessToken } = await response.json();

        // Get user info
        const userResp = await getFarcasterUser(accessToken);
        const user = userResp.result?.user || {};

        // Store auth data
        storeSocialAuth('farcaster', {
          accessToken,
          user: {
            username: user.username,
            displayName: user.displayName,
            pfp: user.pfp?.url,
            profile: user.profile?.url
          }
        });

        setStatus('✓ Farcaster connected successfully!');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (err) {
        console.error('Farcaster callback error:', err);
        setError(err.message || 'Authentication failed');
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>Farcaster Authentication</h2>
      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <p>{status}</p>
      )}
    </div>
  );
}
