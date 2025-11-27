# Multi-Chain NFT Mint — Celo, Arbitrum, Base

This workspace contains a ready-to-use project layout to deploy and mint an ERC-721 NFT across multiple chains (Celo, Arbitrum, Base).

Files added:
- `contracts/MyNFT.sol` — ERC721 contract with `ownerMint` and payable `publicMint`.
- `hardhat.config.js` — networks for Alfajores/Celo, Arbitrum, and Base.
- `scripts/deploy.js` — deploy helper that reads env vars.
- `frontend/src/App.jsx` — simple React app (WalletConnect + ethers) to call `publicMint`.
- `frontend/package.json` — minimal frontend deps.
- `package.json` — root scripts for compile and deploy.

Quick start

1. Install dependencies (root):

```bash
npm install
```

2. Set environment variables in `.env` (create at repo root):

```
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
CELO_ALFAJORES_RPC=https://alfajores-forno.celo-testnet.org
CELO_RPC=https://forno.celo.org
ARB_GOERLI_RPC=https://goerli-rollup.arbitrum.io/rpc
ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
BASE_RPC=https://mainnet.base.org
BASE_TEST_RPC=https://goerli.base.org
NFT_NAME=MyNFT
NFT_SYMBOL=MNFT
MAX_SUPPLY=1000
MINT_PRICE=0.01
```

3. Compile & deploy (example to Alfajores):

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network alfajores
```

4. Run frontend (from `frontend/`):

```bash
cd frontend
npm install
npm start
```

Notes:
- Replace RPC endpoints and keys with your preferred providers (Infura/Alchemy/QuickNode).
- After deploy you'll have separate contract addresses per chain. Use them in the frontend.
- Consider verifying the contract on explorers with the printed verify command.
