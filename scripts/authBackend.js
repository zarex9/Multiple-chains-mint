/**
 * Backend OAuth Handler Example
 * Express.js routes for GitHub and Farcaster OAuth callbacks
 * 
 * Setup:
 * 1. Install dependencies: npm install express axios dotenv
 * 2. Add environment variables:
 *    - GITHUB_CLIENT_ID
 *    - GITHUB_CLIENT_SECRET
 *    - FARCASTER_CLIENT_ID
 *    - FARCASTER_CLIENT_SECRET
 * 3. Import and use these routes in your Express app
 */

const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

/**
 * GitHub OAuth Callback Handler
 * POST /api/auth/github/callback
 */
router.post('/auth/github/callback', async (req, res) => {
  try {
    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No authorization code provided' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        state
      },
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    const { access_token, error } = tokenResponse.data;

    if (error) {
      return res.status(400).json({ error: `GitHub error: ${error}` });
    }

    // Return access token to frontend
    res.json({ accessToken: access_token });
  } catch (err) {
    console.error('GitHub OAuth error:', err);
    res.status(500).json({ error: 'OAuth exchange failed' });
  }
});

/**
 * Farcaster OAuth Callback Handler
 * POST /api/auth/farcaster/callback
 */
router.post('/auth/farcaster/callback', async (req, res) => {
  try {
    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No authorization code provided' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://api.warpcast.com/v2/auth/token',
      {
        clientId: process.env.FARCASTER_CLIENT_ID,
        clientSecret: process.env.FARCASTER_CLIENT_SECRET,
        code,
        state
      }
    );

    const { result, error } = tokenResponse.data;

    if (error || !result?.accessToken) {
      return res.status(400).json({ error: `Farcaster error: ${error}` });
    }

    // Return access token to frontend
    res.json({ accessToken: result.accessToken });
  } catch (err) {
    console.error('Farcaster OAuth error:', err);
    res.status(500).json({ error: 'OAuth exchange failed' });
  }
});

module.exports = router;

/**
 * Usage in main Express app:
 * 
 * const express = require('express');
 * const authRoutes = require('./routes/auth');
 * 
 * const app = express();
 * app.use(express.json());
 * app.use('/api', authRoutes);
 * 
 * app.listen(3001, () => {
 * console.log('Backend server running on port 3001');
 * });
 */
