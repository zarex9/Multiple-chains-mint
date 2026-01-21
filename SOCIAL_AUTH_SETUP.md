# Social Authentication Setup Guide

This guide explains how to set up Farcaster and GitHub OAuth integration for your multi-chain NFT minter.

## Overview

The social auth feature allows users to:
- Connect their GitHub and Farcaster accounts
- Share NFT mint achievements to Farcaster as Casts
- Save mint achievements to GitHub as private Gists
- Manage multiple social connections

## Setup Steps

### 1. GitHub OAuth Setup

#### A. Create GitHub OAuth App

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the form:
   - **Application name:** Multi-Chain NFT Minter
   - **Homepage URL:** `http://localhost:3000` (development) or your production URL
   - **Authorization callback URL:** `http://localhost:3000/auth/github/callback`
4. Copy the **Client ID** and generate a **Client Secret**

#### B. Add Environment Variables

Frontend (`.env` or `.env.local`):
```
REACT_APP_GITHUB_CLIENT_ID=your_github_client_id_here
```

Backend (`.env`):
```
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

### 2. Farcaster OAuth Setup

#### A. Create Farcaster OAuth App

1. Go to [Warpcast Developer Settings](https://warpcast.com/~/developers)
2. Create a new application
3. Fill in the details:
   - **App name:** Multi-Chain NFT Minter
   - **Redirect URL:** `http://localhost:3000/auth/farcaster/callback`
4. Copy the **Client ID**

#### B. Add Environment Variables

Frontend (`.env` or `.env.local`):
```
REACT_APP_FARCASTER_CLIENT_ID=your_farcaster_client_id_here
```

Backend (`.env`):
```
FARCASTER_CLIENT_ID=your_farcaster_client_id_here
FARCASTER_CLIENT_SECRET=your_farcaster_client_secret_here
```

### 3. Frontend Integration

The following components are already added:

- **`utils/socialAuth.js`** - Core OAuth utilities and sharing functions
- **`SocialAuthPanel.jsx`** - UI component for social connections
- **`GitHubCallback.jsx`** - GitHub OAuth callback handler
- **`FarcasterCallback.jsx`** - Farcaster OAuth callback handler
- **`App.jsx`** - Updated main app with social auth integration

### 4. Backend Setup (Optional but Recommended)

For production, use a secure backend to exchange OAuth codes for tokens:

#### A. Install Dependencies

```bash
npm install express axios dotenv
```

#### B. Set Up OAuth Routes

Copy `scripts/authBackend.js` or use as reference to create your backend auth routes:

```javascript
const express = require('express');
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());
app.use('/api', authRoutes);

app.listen(3001, () => {
  console.log('Auth backend running on port 3001');
});
```

#### C. Configure Frontend API

Update the frontend to point to your backend:

```javascript
// In socialAuth.js or your config
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';
```

### 5. Router Setup (React Router)

Add these routes to your React Router configuration:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import GitHubCallback from './GitHubCallback';
import FarcasterCallback from './FarcasterCallback';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/auth/github/callback" element={<GitHubCallback />} />
        <Route path="/auth/farcaster/callback" element={<FarcasterCallback />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 6. Environment Variables Summary

**Frontend (.env.local or .env):**
```
REACT_APP_GITHUB_CLIENT_ID=your_client_id
REACT_APP_FARCASTER_CLIENT_ID=your_client_id
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WALLETCONNECT_ID=your_walletconnect_project_id
REACT_APP_CELO_RPC=https://forno.celo.org
REACT_APP_ARB_RPC=https://arb1.arbitrum.io/rpc
REACT_APP_BASE_RPC=https://mainnet.base.org
```

**Backend (.env):**
```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
FARCASTER_CLIENT_ID=your_client_id
FARCASTER_CLIENT_SECRET=your_client_secret
```

## Features

### Connect Social Accounts
- Click "Connect" buttons in the Social Connections panel
- User is redirected to OAuth provider
- Account is linked after authorization

### Share Mint Achievements
- After minting an NFT, click "Share Cast" to post to Farcaster
- Click "Share as Gist" to save to GitHub as private Gist
- Includes network, contract, transaction hash, and timestamp

### Manage Connections
- View connection status with checkmarks
- Disconnect accounts anytime
- Data is stored in browser localStorage

## API Endpoints

### GitHub OAuth
- **URL:** `https://github.com/login/oauth/authorize`
- **Token Exchange:** `https://github.com/login/oauth/access_token`
- **User API:** `https://api.github.com/user`
- **Create Gist:** `POST https://api.github.com/gists`

### Farcaster OAuth
- **URL:** `https://warpcast.com/~/authorize`
- **Token Exchange:** `POST https://api.warpcast.com/v2/auth/token`
- **User API:** `https://api.warpcast.com/v2/user/profile`
- **Create Cast:** `POST https://api.warpcast.com/v2/casts`

## Troubleshooting

### "OAuth Client ID not configured"
- Ensure environment variables are properly set
- Restart development server after changing .env file

### Callback URL mismatch error
- Verify callback URL matches exactly in OAuth app settings
- For development: `http://localhost:3000/auth/github/callback`
- For production: `https://yourdomain.com/auth/github/callback`

### Cannot exchange code for token
- Verify client secret is correct
- Check that backend is running and accessible
- Review backend logs for detailed error messages

### Share buttons not working
- Ensure user is connected to the platform first
- Complete a mint transaction to enable sharing
- Check browser console for error details

## Security Considerations

1. **Never expose client secrets in frontend code**
2. **Always exchange OAuth codes on secure backend**
3. **Use HTTPS for production deployments**
4. **Store tokens securely (consider encrypted storage vs localStorage)**
5. **Implement token refresh mechanisms**
6. **Validate all OAuth responses**

## Production Checklist

- [ ] Set up secure backend OAuth handlers
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS
- [ ] Configure correct callback URLs
- [ ] Implement token refresh logic
- [ ] Add error logging and monitoring
- [ ] Test all OAuth flows thoroughly
- [ ] Document deployment procedures

## References

- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Farcaster OAuth Documentation](https://docs.warpcast.com/reference/oauth)
- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
