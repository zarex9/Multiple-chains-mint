# Daily GMBase Click Feature - Setup Guide

## Overview

**Daily GMBase** is a gamified daily interaction feature on Base chain where users:
- ✅ Click once per 24 hours to earn rewards
- 🔥 Build streaks for bonus rewards
- 🎨 Receive NFTs commemorating each daily click
- 💰 Accumulate rewards in their account
- 🌅 Share their "Good Morning" ritual with the community

## How It Works

### User Flow
1. User connects wallet to **Base chain**
2. Clicks "Click Daily" button (once per 24 hours)
3. Pays 0.001 ETH gas subsidy
4. Receives:
   - Daily reward (0.01 ETH base)
   - Streak bonus if clicking daily
   - NFT commemorating the click
5. Can claim accumulated rewards anytime

### Rewards System
```
Base Daily Reward: 0.01 ETH
Streak Bonus: 5% per consecutive day
Example:
  Day 1: 0.01 ETH + NFT
  Day 2: 0.01 ETH + (0.01 × 1 × 0.05) = 0.0105 ETH + NFT
  Day 3: 0.01 ETH + (0.01 × 2 × 0.05) = 0.011 ETH + NFT
  ...continues if daily clicks maintained
```

### Gas Fee Subsidy
- Users pay: **0.001 ETH** per click
- Covers transaction costs on Base
- Smart contract subsidizes remaining gas

## Smart Contract Details

### Contract: DailyGMBase.sol

**Functions:**
- `dailyClick(metadata)` - Perform daily click (payable)
- `canClickToday(user)` - Check if user can click
- `getTimeUntilNextClick(user)` - Time remaining (seconds)
- `getStreak(user)` - Get current streak
- `getTotalRewards(user)` - View accumulated rewards
- `claimRewards()` - Withdraw rewards

**Events:**
- `DailyClick(user, tokenId, reward, streak, timestamp)`
- `StreakBroken(user, lastStreak)`
- `RewardClaimed(user, amount)`

## Deployment

### 1. Deploy to Base Chain

```bash
# Compile contract
npm run compile

# Deploy to Base
npx hardhat run scripts/deployGMBase.js --network base
```

Output example:
```
✅ DailyGMBase deployed successfully!
📋 Contract Address: 0x1234...abcd
```

### 2. Configure Frontend

Add to `.env.local`:
```env
REACT_APP_GMBASE_CONTRACT=0x1234...abcd
```

### 3. Fund Contract

Send ETH to contract to cover gas subsidies:
```bash
# Example: Send 1 ETH
cast send <CONTRACT_ADDRESS> --value 1ether
```

## Frontend Integration

### DailyGMBase Component

Located in: `frontend/src/DailyGMBase.jsx`

**Props:**
- `signer` - ethers.Signer object
- `network` - Current network ('celo', 'arbitrum', 'base')
- `contractAddr` - Deployed contract address

**Features:**
- 🎯 One-click daily interaction
- ⏱️ Countdown timer to next click
- 🔥 Streak display with bonuses
- 💰 Rewards accumulation display
- 📊 Stats: total clicks, earned rewards
- 🪙 Claim rewards button
- ⛓️ Base chain detection

### Integration Example

```jsx
import DailyGMBase from './DailyGMBase';

export default function App() {
  const [signer, setSigner] = useState(null);
  const [network, setNetwork] = useState('base');
  const [gmbaseContract, setGMBaseContract] = useState('0x...');

  return (
    <div>
      <DailyGMBase 
        signer={signer}
        network={network}
        contractAddr={gmbaseContract}
      />
    </div>
  );
}
```

## Environment Variables

**Frontend (.env.local):**
```env
REACT_APP_GMBASE_CONTRACT=0x1234...abcd
```

**Backend/Deployment (.env):**
```env
# Already configured in hardhat.config.js
BASE_RPC=https://mainnet.base.org
PRIVATE_KEY=your_private_key
```

## Key Features Breakdown

### Daily Click System
- ✅ One click per 24-hour period (enforced by contract)
- ✅ Automatic streak tracking
- ✅ Streak breaks after 2 days without click
- ✅ NFT minted for each click (metadata includes date, network, description)

### Reward Tracking
- ✅ Accumulated rewards visible in real-time
- ✅ Rewards can be claimed anytime
- ✅ Gas fee subsidies reduce user costs
- ✅ Transparent reward calculation

### User Experience
- ✅ Real-time countdown timer
- ✅ Visual streak indicator
- ✅ Responsive grid layout
- ✅ Clear stats display
- ✅ Network detection (only shows on Base)

### Gas Optimization
- ✅ Batch data queries (saves gas)
- ✅ 0.001 ETH subsidy reduces user friction
- ✅ Contract covers remaining gas costs
- ✅ Efficient state management

## Testing

### Local Testing

```bash
# Start local network
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deployGMBase.js --network localhost

# Run tests
npx hardhat test
```

### Testnet Testing

```bash
# Deploy to Base Sepolia testnet
npx hardhat run scripts/deployGMBase.js --network baseSepolia
```

## Monitoring & Maintenance

### Owner Functions
- `setDailyReward(newReward)` - Adjust daily reward amount
- `setRewardAmount(newAmount)` - Adjust gas subsidy
- `setStreakMultiplier(newMultiplier)` - Adjust streak bonus
- `withdraw()` - Collect contract fees

### View Contract Stats

```javascript
// Get user streak
const streak = await contract.getStreak(userAddress);

// Get earned rewards
const rewards = await contract.getTotalRewards(userAddress);

// Check if can click today
const canClick = await contract.canClickToday(userAddress);

// Time until next click
const timeLeft = await contract.getTimeUntilNextClick(userAddress);
```

## Security Considerations

### Smart Contract Security
- ✅ `ReentrancyGuard` prevents reentrancy attacks
- ✅ `nonReentrant` on critical functions
- ✅ Owner-based access control
- ✅ Input validation on timestamps

### Frontend Security
- ✅ Wallet connection validation
- ✅ Contract address verification
- ✅ Gas price estimation
- ✅ Error handling and user feedback

### Best Practices
- 🔒 Use HTTPS in production
- 🔒 Secure private keys in .env
- 🔒 Regular contract audits
- 🔒 Monitor reward spending

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Already clicked today" | Wait 24 hours from last click |
| Button not showing | Switch to Base chain in wallet |
| "Insufficient payment" | Ensure 0.001 ETH minimum |
| Claim button disabled | Must have rewards > 0 |
| NFT not minting | Check contract has gas budget |
| Countdown not updating | Refresh page or restart frontend |

## Performance Metrics

- **Gas per click:** ~100k-150k (with subsidy)
- **Transaction time:** ~12-30 seconds (Base)
- **Data refresh:** Every 30 seconds
- **NFT minting:** Automatic with each click

## Future Enhancements

- 🎯 Leaderboard for streaks
- 🎯 Seasonal challenges
- 🎯 NFT collection perks
- 🎯 Community events
- 🎯 Tier system (Bronze/Silver/Gold/Platinum)
- 🎯 Social sharing achievements

## Support & Documentation

- Smart Contract: [DailyGMBase.sol](../contracts/DailyGMBase.sol)
- Frontend Component: [DailyGMBase.jsx](../frontend/src/DailyGMBase.jsx)
- Deployment Script: [deployGMBase.js](./deployGMBase.js)
- Base Chain Docs: https://docs.base.org
