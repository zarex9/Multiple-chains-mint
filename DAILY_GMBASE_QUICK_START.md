# Daily GMBase - Quick Start (2 minutes)

## What is it?

🌅 **Daily GMBase** = Daily "Good Morning" click on Base chain that earns you rewards!

- Click once per 24 hours
- Build streaks for bonus rewards
- Get NFTs for each click
- Accumulate ETH rewards

## Fast Setup

### Step 1: Deploy Contract (1 minute)

```bash
npm run compile
npx hardhat run scripts/deployGMBase.js --network base
```

Copy the deployed address: `0x...`

### Step 2: Configure Frontend (30 seconds)

Add to `frontend/.env.local`:
```env
REACT_APP_GMBASE_CONTRACT=0x...
```

### Step 3: Start App (30 seconds)

```bash
cd frontend
npm start
```

✅ Done! Daily GMBase is live!

## How to Use

1. **Connect wallet** to Base chain
2. **Scroll to "Daily GMBase Click"** section
3. **Click "Click Daily"** button
4. **Pay 0.001 ETH** gas subsidy
5. **Earn rewards** and NFT!

## That's It! 🎉

### Quick Facts
- 💰 **0.01 ETH** base daily reward
- 🔥 **5% bonus** per consecutive day
- 🎨 **NFT** minted for each click
- ⛓️ **Base chain only**
- 🛑 **Once per 24 hours**

### Test on Testnet First

```bash
# Switch to Base Sepolia in your wallet
npx hardhat run scripts/deployGMBase.js --network baseSepolia
```

## Troubleshooting

**Button not showing?**
- Switch to Base chain in wallet

**"Already clicked today" error?**
- Wait 24 hours since last click

**Rewards not showing?**
- Reload page or wait 30 seconds

**Need help?**
- See [DAILY_GMBASE_SETUP.md](DAILY_GMBASE_SETUP.md) for full guide

## File Structure

```
contracts/
  └─ DailyGMBase.sol          # Smart contract
frontend/src/
  └─ DailyGMBase.jsx          # UI component
scripts/
  └─ deployGMBase.js          # Deployment
```

## Environment Variables

Only 1 required:
```env
REACT_APP_GMBASE_CONTRACT=0x...
```

## Next: Customize!

Adjust in `DailyGMBase.sol`:
- Daily reward amount
- Streak multiplier
- Gas subsidy

Then redeploy!

---

**Let's get your Daily GMBase running!** 🚀
