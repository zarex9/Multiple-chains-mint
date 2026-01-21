/**
 * Social Authentication Utils
 * Handles Farcaster and GitHub OAuth integrations
 */

// GitHub OAuth Configuration
export const GITHUB_CLIENT_ID = process.env.REACT_APP_GITHUB_CLIENT_ID || '';
export const GITHUB_REDIRECT_URI = `${window.location.origin}/auth/github/callback`;
export const GITHUB_AUTH_URL = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_REDIRECT_URI}&scope=user:email`;

// Farcaster OAuth Configuration
export const FARCASTER_CLIENT_ID = process.env.REACT_APP_FARCASTER_CLIENT_ID || '';
export const FARCASTER_REDIRECT_URI = `${window.location.origin}/auth/farcaster/callback`;
export const FARCASTER_AUTH_URL = `https://warpcast.com/~/authorize?clientId=${FARCASTER_CLIENT_ID}&redirectUrl=${FARCASTER_REDIRECT_URI}`;

/**
 * Connect to GitHub OAuth
 */
export function connectGitHub() {
  if (!GITHUB_CLIENT_ID) {
    console.error('GitHub Client ID not configured');
    return;
  }
  window.location.href = GITHUB_AUTH_URL;
}

/**
 * Connect to Farcaster OAuth
 */
export function connectFarcaster() {
  if (!FARCASTER_CLIENT_ID) {
    console.error('Farcaster Client ID not configured');
    return;
  }
  window.location.href = FARCASTER_AUTH_URL;
}

/**
 * Get GitHub user info from token
 */
export async function getGitHubUser(accessToken) {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch GitHub user');
    return await response.json();
  } catch (err) {
    console.error('GitHub user fetch error:', err);
    return null;
  }
}

/**
 * Get Farcaster user info from token
 */
export async function getFarcasterUser(accessToken) {
  try {
    const response = await fetch('https://api.warpcast.com/v2/user/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch Farcaster user');
    return await response.json();
  } catch (err) {
    console.error('Farcaster user fetch error:', err);
    return null;
  }
}

/**
 * Store social auth data in localStorage
 */
export function storeSocialAuth(platform, data) {
  const socialAuth = JSON.parse(localStorage.getItem('socialAuth') || '{}');
  socialAuth[platform] = {
    ...data,
    connectedAt: new Date().toISOString()
  };
  localStorage.setItem('socialAuth', JSON.stringify(socialAuth));
}

/**
 * Get stored social auth data
 */
export function getSocialAuth(platform) {
  const socialAuth = JSON.parse(localStorage.getItem('socialAuth') || '{}');
  return socialAuth[platform] || null;
}

/**
 * Disconnect social auth
 */
export function disconnectSocialAuth(platform) {
  const socialAuth = JSON.parse(localStorage.getItem('socialAuth') || '{}');
  delete socialAuth[platform];
  localStorage.setItem('socialAuth', JSON.stringify(socialAuth));
}

/**
 * Share mint achievement to social platform
 */
export async function shareToFarcaster(mintData) {
  const farcasterAuth = getSocialAuth('farcaster');
  if (!farcasterAuth || !farcasterAuth.accessToken) {
    alert('Please connect Farcaster first');
    return;
  }

  const message = `Just minted an NFT on ${mintData.network}! 🎨
Contract: ${mintData.contractAddr.slice(0, 6)}...${mintData.contractAddr.slice(-4)}
Tx: ${mintData.txHash.slice(0, 6)}...${mintData.txHash.slice(-4)}
#NFT #${mintData.network}`;

  try {
    const response = await fetch('https://api.warpcast.com/v2/casts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${farcasterAuth.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: message })
    });
    if (!response.ok) throw new Error('Failed to post to Farcaster');
    alert('Shared to Farcaster!');
    return await response.json();
  } catch (err) {
    console.error('Farcaster share error:', err);
    alert('Failed to share to Farcaster');
  }
}

/**
 * Share mint achievement to GitHub as a Gist
 */
export async function shareToGitHub(mintData, accessToken) {
  if (!accessToken) {
    alert('Please connect GitHub first');
    return;
  }

  const gistContent = `# NFT Mint Achievement 🎨

**Network:** ${mintData.network}
**Contract:** ${mintData.contractAddr}
**Transaction:** ${mintData.txHash}
**Timestamp:** ${new Date().toISOString()}
**Token URI:** ${mintData.uri}

Minted on the multi-chain NFT platform!`;

  try {
    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        description: `NFT Mint - ${mintData.network}`,
        public: false,
        files: {
          'mint-achievement.md': {
            content: gistContent
          }
        }
      })
    });
    if (!response.ok) throw new Error('Failed to create GitHub Gist');
    alert('Shared to GitHub Gist!');
    return await response.json();
  } catch (err) {
    console.error('GitHub share error:', err);
    alert('Failed to share to GitHub');
  }
}
