# Multi-Chain NFT Mint — Celo, Arbitrum, Base

This document contains a ready-to-use project layout, code snippets and step-by-step instructions to **copy the repo **``, adapt it, and enable **NFT minting on three chains**: **Celo (Alfajores or Mainnet)**, **Arbitrum (One or Goerli)** and **Base (mainnet or testnet)**.

> **Note:** I copied the workflow/structure of a typical NFT repo and added the multi-chain deployment + front-end (WalletConnect) integration. Replace variables (`RPC`, `PRIVATE_KEY`, API keys) before running.

---

## 1) Quick clone + copy steps

```bash
# 1. Clone original repo
gh repo clone CryptoExplor/CeloNFT
cd CeloNFT

# 2. Create a new repo locally (optional)
git remote remove origin
git init
git add .
git commit -m "Initial import from CryptoExplor/CeloNFT"
# then create a new repo on GitHub and push
# gh repo create my-multi-nft --public --source=. --remote=origin
# git push -u origin main
```

Copy all project files. We'll add/replace the `contracts/`, `hardhat.config.js`, `scripts/` and `frontend/` files below.

---

## 2) Project layout (final)

```
CeloNFT-multichain/
├─ contracts/
│  └─ MyNFT.sol
├─ scripts/
│  └─ deploy.js
├─ frontend/
│  ├─ package.json
│  └─ src/
│     └─ App.jsx
├─ hardhat.config.js
├─ package.json
└─ README.md
```

---

## 3) Solidity NFT contract (`contracts/MyNFT.sol`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title MyNFT - simple ERC721 with owner mint + public mint
contract MyNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 public nextTokenId;
    uint256 public maxSupply;
    uint256 public price;
    bool public publicMintEnabled;

    event Minted(address indexed to, uint256 indexed tokenId);

    constructor(string memory name_, string memory symbol_, uint256 maxSupply_, uint256 priceWei_) ERC721(name_, symbol_) {
        maxSupply = maxSupply_;
        price = priceWei_;
        nextTokenId = 1; // start at 1
        publicMintEnabled = true;
    }

    function ownerMint(address to, string calldata uri) external onlyOwner returns (uint256) {
        require(nextTokenId <= maxSupply, "max supply reached");
        uint256 id = nextTokenId++;
        _safeMint(to, id);
        _setTokenURI(id, uri);
        emit Minted(to, id);
        return id;
    }

    function publicMint(string calldata uri) external payable nonReentrant returns (uint256) {
        require(publicMintEnabled, "public mint disabled");
        require(nextTokenId <= maxSupply, "max supply reached");
        require(msg.value >= price, "insufficient payment");

        uint256 id = nextTokenId++;
        _safeMint(msg.sender, id);
        _setTokenURI(id, uri);
        emit Minted(msg.sender, id);
        return id;
    }

    function withdraw(address payable to) external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "no funds");
        to.transfer(bal);
    }

    function setPrice(uint256 newPrice) external onlyOwner { price = newPrice; }
    function setMaxSupply(uint256 s) external onlyOwner { maxSupply = s; }
    function togglePublicMint(bool v) external onlyOwner { publicMintEnabled = v; }

    // allow receiving native tokens
    receive() external payable {}
}
```

**Notes:**

* This simple contract supports `ownerMint` and `publicMint` (payable). Adjust `price` and `maxSupply` as needed.
* For Celo, `msg.value` is in CELO/native unit — same for Base/Arbitrum (native gas token). For ERC-721 on Celo you can accept native tokens or integrate cUSD — keep simple here.

---

## 4) Hardhat config (`hardhat.config.js`)

```js
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-etherscan');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

module.exports = {
  solidity: '0.8.19',
  networks: {
    alfajores: {
      url: process.env.CELO_ALFAJORES_RPC || 'https://alfajores-forno.celo-testnet.org',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 44787
    },
    celo: {
      url: process.env.CELO_RPC || 'https://forno.celo.org',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 42220
    },
    arbitrumGoerli: {
      url: process.env.ARB_GOERLI_RPC || 'https://goerli-rollup.arbitrum.io/rpc',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 421613
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 42161
    },
    base: {
      url: process.env.BASE_RPC || 'https://mainnet.base.org',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 8453
    },
    baseTest: {
      url: process.env.BASE_TEST_RPC || 'https://goerli.base.org',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 84531
    }
  },
  etherscan: {
    apiKey: {
      // explorer API keys if available
      arbitrum: process.env.ARBISCAN_KEY || '',
      base: process.env.BASESCAN_KEY || '',
      celo: process.env.CELOSCAN_KEY || ''
    }
  }
};
```

**Add **`` with `PRIVATE_KEY` and RPC endpoints as needed.

---

## 5) Deploy script (`scripts/deploy.js`)

```js
const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with', deployer.address, 'on', hre.network.name);

  const name = process.env.NFT_NAME || 'MultiChainNFT';
  const symbol = process.env.NFT_SYMBOL || 'MCN';
  const maxSupply = parseInt(process.env.MAX_SUPPLY || '1000');
  const price = hre.ethers.parseUnits(process.env.MINT_PRICE || '0.01', 'ether');

  const MyNFT = await hre.ethers.getContractFactory('MyNFT');
  const nft = await MyNFT.deploy(name, symbol, maxSupply, price);
  await nft.deployed();
  console.log('Deployed NFT at', nft.address);

  // show example verify command
  console.log('\nVerify with:');
  console.log(`npx hardhat verify --network ${hre.network.name} ${nft.address} "${name}" "${symbol}" ${maxSupply} ${price.toString()}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

**Usage:**

```bash
# deploy to Alfajores (Celo testnet)
npx hardhat run scripts/deploy.js --network alfajores

# deploy to Arbitrum Goerli
npx hardhat run scripts/deploy.js --network arbitrumGoerli

# deploy to Base Test
npx hardhat run scripts/deploy.js --network baseTest
```

After deploying to each target network, you will have 3 separate NFT contract instances (one per chain). That is the recommended, simplest approach.

---

## 6) Frontend (React) — `frontend/src/App.jsx` (WalletConnect, ethers)

```jsx
import React, { useState } from 'react';
import { ethers } from 'ethers';
import WalletConnectProvider from '@walletconnect/web3-provider';

const CONTRACT_ABI = [
  'function publicMint(string uri) payable returns (uint256)',
  'function ownerMint(address to, string calldata uri) external returns (uint256)'
];

const NETWORKS = {
  celo: { chainId: '0xA4EC', name: 'Celo', rpc: process.env.REACT_APP_CELO_RPC },
  arbitrum: { chainId: '0xA4B1', name: 'Arbitrum', rpc: process.env.REACT_APP_ARB_RPC },
  base: { chainId: '0x2123', name: 'Base', rpc: process.env.REACT_APP_BASE_RPC }
}

export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [network, setNetwork] = useState('celo');
  const [contractAddr, setContractAddr] = useState('');
  const [uri, setUri] = useState('https://ipfs.io/ipfs/<CID>');
  const [price, setPrice] = useState('0.01');

  async function connectWallet() {
    const wcProvider = new WalletConnectProvider({ rpc: { 42220: NETWORKS.celo.rpc, 42161: NETWORKS.arbitrum.rpc, 8453: NETWORKS.base.rpc } });
    await wcProvider.enable();
    const web3Provider = new ethers.BrowserProvider(wcProvider);
    const signer = await web3Provider.getSigner();
    setProvider(web3Provider);
    setSigner(signer);
  }

  async function mint() {
    if (!signer) { alert('connect wallet'); return; }
    if (!contractAddr) { alert('set contract address'); return; }
    const contract = new ethers.Contract(contractAddr, CONTRACT_ABI, signer);
    const tx = await contract.publicMint(uri, { value: ethers.parseUnits(price, 'ether') });
    await tx.wait();
    alert('Minted — tx: ' + tx.hash);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>MultiChain NFT Minter (Celo / Arbitrum / Base)</h2>
      <button onClick={connectWallet}>Connect Wallet (WalletConnect)</button>

      <div style={{ marginTop: 12 }}>
        <label>Network:</label>
        <select value={network} onChange={(e) => setNetwork(e.target.value)}>
          <option value="celo">Celo</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="base">Base</option>
        </select>
      </div>

      <div>
        <label>Contract address (on chosen network):</label>
        <input value={contractAddr} onChange={(e) => setContractAddr(e.target.value)} />
      </div>

      <div>
        <label>Token URI (IPFS):</label>
        <input value={uri} onChange={(e) => setUri(e.target.value)} />
      </div>

      <div>
        <label>Price (native):</label>
        <input value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>

      <button onClick={mint}>Public Mint</button>
    </div>
  );
}
```

**Notes:**

* Use WalletConnect provider to connect wallets across chains. The provider's RPC mapping needs proper RPC URLs.
* The frontend sends `publicMint(uri)` with a value in native token.

---

## 7) How to mint on 3 chains — recommended approach (simple)

1. **Deploy the same **``** contract separately on each chain** (Celo, Arbitrum, Base). Each deployment produces an address per chain.
2. **Verify** the contract sources on each chain's block explorer.
3. **Run frontend** and let users pick the network they want to mint on; they must hold the native token for gas there.
4. **Mint flow**: connect wallet (WalletConnect), pick network/contract address, call `publicMint(uri)` with the correct `value`.

This approach is: simple, auditable, gets Verified Contracts Usage on each chain, and does not require bridges.

---

## 8) How to write the NFT contract (final short guide)

1. Use OpenZeppelin ERC721 (or ERC721A for gas savings).
2. Decide mint mechanics: ownerMint vs publicMint vs whitelist. Implement appropriate access control.
3. Track `totalSupply` and `maxSupply`.
4. For payable mints, validate `msg.va
