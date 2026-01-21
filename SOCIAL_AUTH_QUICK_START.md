# Social Auth Feature - Quick Start

## What's New

Your multi-chain NFT minter now includes **GitHub and Farcaster OAuth integration**! Users can:

✅ Connect their GitHub account  
✅ Connect their Farcaster account  
✅ Share mint achievements to Farcaster as Casts  
✅ Save mint records to GitHub as private Gists  
✅ Manage multiple social connections seamlessly  

## Quick Setup (5 minutes)

### 1️⃣ Register OAuth Apps

**GitHub:**
- Go to https://github.com/settings/developers → OAuth Apps
- Create new app with callback: `http://localhost:3000/auth/github/callback`
- Copy Client ID and Client Secret

**Farcaster:**
- Go to https://warpcast.com/~/developers
- Create new app with callback: `http://localhost:3000/auth/farcaster/callback`
- Copy Client ID and Client Secret

### 2️⃣ Add Environment Variables

Create `.env.local` in the `frontend/` directory:

```env
REACT_APP_GITHUB_CLIENT_ID=your_github_client_id
REACT_APP_FARCASTER_CLIENT_ID=your_farcaster_client_id
```

### 3️⃣ Install Dependencies

```bash
cd frontend
npm install react-router-dom
npm start
```

That's it! The social auth UI is already integrated in the app.

## Features

### Social Connection Panel

Located at the bottom of the app, shows:
- **GitHub** - Connect/disconnect, share as Gist
- **Farcaster** - Connect/disconnect, share as Cast

### Share Your Mints

After minting an NFT:
- Click **"Share Cast"** to post to Farcaster
- Click **"Share as Gist"** to save to GitHub

Shared content includes:
- Network (Celo, Arbitrum, or Base)
- Contract address
- Transaction hash
- Token URI
- Timestamp

## Files Added

```
frontend/
├── src/
│   ├── SocialAuthPanel.jsx          # Social connection UI
│   ├── GitHubCallback.jsx           # GitHub OAuth callback
│   ├── FarcasterCallback.jsx        # Farcaster OAuth callback
│   ├── utils/
│   │   └── socialAuth.js            # OAuth utilities & API calls
│   └── App.jsx                      # Updated with social auth
├── package.json                     # Added react-router-dom

scripts/
└── authBackend.js                   # Optional backend OAuth handler

SOCIAL_AUTH_SETUP.md                 # Detailed setup guide
.env.example                         # Updated with OAuth vars
```

## Architecture

```
User clicks "Connect GitHub"
    ↓
connectGitHub() redirects to GitHub OAuth
    ↓
User authorizes app
    ↓
GitHub redirects to /auth/github/callback
    ↓
GitHubCallback.jsx exchanges code for token
    ↓
Token stored in localStorage
    ↓
User can now share to GitHub
```

## Data Flow

### Sharing to Farcaster
```
publicMint() creates mintData
    ↓
Click "Share Cast"
    ↓
shareToFarcaster() uses stored accessToken
    ↓
POST to Farcaster API
    ↓
Cast appears on Farcaster
```

### Sharing to GitHub
```
publicMint() creates mintData
    ↓
Click "Share as Gist"
    ↓
shareToGitHub() uses stored accessToken
    ↓
POST to GitHub API
    ↓
Private Gist created
```

## Production Setup

For production deployments, implement a **secure backend** for OAuth token exchange:

```javascript
// Express backend example
app.post('/api/auth/github/callback', async (req, res) => {
  const { code } = req.body;
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    })
  });
  const { access_token } = await tokenRes.json();
  res.json({ accessToken: access_token });
});
```

See [SOCIAL_AUTH_SETUP.md](SOCIAL_AUTH_SETUP.md) for complete backend setup.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Buttons not showing | Restart frontend after adding .env vars |
| "OAuth not configured" | Check .env.local has correct Client IDs |
| Callback URL error | Verify exact URL in OAuth app settings |
| Share button doesn't work | Mint an NFT first, then connect socials |
| Token errors | Clear localStorage in DevTools if needed |

## Security Notes

✅ **Safe:** OAuth tokens are stored in localStorage by default  
⚠️ **For Production:** Implement encrypted storage or backend sessions  
🔒 **Never:** Expose client secrets in frontend code  
🔐 **Always:** Use HTTPS in production  

## Next Steps

- [Full Setup Guide](SOCIAL_AUTH_SETUP.md)
- [Backend Integration](scripts/authBackend.js)
- [GitHub OAuth Docs](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Farcaster OAuth Docs](https://docs.warpcast.com/reference/oauth)

## Support

Need help? Check:
1. `.env.local` has correct Client IDs
2. OAuth app callback URLs match exactly
3. Browser console for error messages
4. Network tab for API failures

Happy minting! 🎨
