import React, { useState, useEffect } from 'react';
import {
  connectGitHub,
  connectFarcaster,
  getSocialAuth,
  disconnectSocialAuth,
  shareToFarcaster,
  shareToGitHub
} from './utils/socialAuth';

export default function SocialAuthPanel({ mintData }) {
  const [gitHubAuth, setGitHubAuth] = useState(null);
  const [farcasterAuth, setFarcasterAuth] = useState(null);

  useEffect(() => {
    // Check stored auth on mount
    setGitHubAuth(getSocialAuth('github'));
    setFarcasterAuth(getSocialAuth('farcaster'));
  }, []);

  const handleDisconnectGitHub = () => {
    disconnectSocialAuth('github');
    setGitHubAuth(null);
  };

  const handleDisconnectFarcaster = () => {
    disconnectSocialAuth('farcaster');
    setFarcasterAuth(null);
  };

  const handleShareToFarcaster = async () => {
    if (!mintData) {
      alert('Complete a mint first');
      return;
    }
    await shareToFarcaster(mintData);
  };

  const handleShareToGitHub = async () => {
    if (!mintData || !gitHubAuth?.accessToken) {
      alert('Please connect GitHub and complete a mint');
      return;
    }
    await shareToGitHub(mintData, gitHubAuth.accessToken);
  };

  return (
    <div style={{
      padding: '15px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      marginTop: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Social Connections</h3>

      {/* GitHub */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🐙 GitHub</span>
          {gitHubAuth ? (
            <>
              <span style={{ color: 'green', fontSize: '12px' }}>✓ Connected</span>
              <button
                onClick={handleDisconnectGitHub}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #999',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Disconnect
              </button>
              <button
                onClick={handleShareToGitHub}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: '#0366d6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Share as Gist
              </button>
            </>
          ) : (
            <button
              onClick={connectGitHub}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Farcaster */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>⭐ Farcaster</span>
          {farcasterAuth ? (
            <>
              <span style={{ color: 'green', fontSize: '12px' }}>✓ Connected</span>
              <button
                onClick={handleDisconnectFarcaster}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #999',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Disconnect
              </button>
              <button
                onClick={handleShareToFarcaster}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: '#8A63D2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Share Cast
              </button>
            </>
          ) : (
            <button
              onClick={connectFarcaster}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                backgroundColor: '#8A63D2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
