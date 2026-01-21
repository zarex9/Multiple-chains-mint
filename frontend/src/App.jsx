import React, { useState } from 'react';
import { ethers } from 'ethers';
import WalletConnectProvider from '@walletconnect/ethereum-provider';
import SocialAuthPanel from './SocialAuthPanel';

/* -----------------------------
   Contract ABI
-------------------------------- */
const CONTRACT_ABI = [
  'function publicMint(string uri) payable returns (uint256)',
  'function ownerMint(address to, string uri) returns (uint256)'
];

/* -----------------------------
   Network Config
-------------------------------- */
type NetworkKey = 'celo' | 'arbitrum' | 'base';

const NETWORKS: Record<
  NetworkKey,
  { chainId: number; name: string; rpc?: string }
> = {
  celo: {
    chainId: 42220,
    name: 'Celo',
    rpc: process.env.REACT_APP_CELO_RPC
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum',
    rpc: process.env.REACT_APP_ARB_RPC
  },
  base: {
    chainId: 8453,
    name: 'Base',
    rpc: process.env.REACT_APP_BASE_RPC
  }
};

export default function App() {
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [network, setNetwork] = useState('celo');
  const [contractAddr, setContractAddr] = useState('');
  const [uri, setUri] = useState('https://ipfs.io/ipfs/<CID>');
  const [price, setPrice] = useState('0.01');
  const [mintData, setMintData] = useState(null);
  const [loading, setLoading] = useState(false);

  /* -----------------------------
     Connect Wallet
  -------------------------------- */
  async function connectWallet() {
    try {
      const nw = NETWORKS[network];

      if (!nw.rpc) {
        alert(`RPC not configured for ${nw.name}`);
        return;
      }

      const wcProvider = await WalletConnectProvider.init({
        projectId: process.env.REACT_APP_WALLETCONNECT_ID!,
        chains: [nw.chainId],
        rpcMap: { [nw.chainId]: nw.rpc }
      });

      await wcProvider.connect();

      const browserProvider = new ethers.BrowserProvider(wcProvider);
      const signer = await browserProvider.getSigner();

      setProvider(browserProvider);
      setSigner(signer);

      alert(`Connected to ${nw.name}`);
    } catch (err) {
      console.error(err);
      alert('Wallet connection failed');
    }
  }

  /* -----------------------------
     Mint NFT
  -------------------------------- */
  async function mint() {
    if (!signer) {
      alert('Connect wallet first');
      return;
    }

    if (!ethers.isAddress(contractAddr)) {
      alert('Invalid contract address');
      return;
    }

    try {
      setLoading(true);

      const priceWei = ethers.parseEther(price);
      const contract = new ethers.Contract(
        contractAddr,
        CONTRACT_ABI,
        signer
      );

      const tx = await contract.publicMint(uri, {
        value: priceWei
      const receipt = await tx.wait();

      const minted = {
        network: NETWORKS[network].name,
        contractAddr,
        uri,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        timestamp: new Date().toISOString()
      };

      setMintData(minted

      await tx.wait();

      alert(`Mint successful!\nTx Hash: ${tx.hash}`);
    } catch (err: any) {
      console.error(err);
      alert(err?.reason || err?.message || 'Mint failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 480 }}>
      <h2>Multi-Chain NFT Minter</h2>
      <p>Celo • Arbitrum • Base</p>

      <button onClick={connectWallet}>Connect Wallet</button>

      <hr />

      <div>
        <label>Network</label>
        <select
          value={network}
          onChange={e => setNetwork(e.target.value as NetworkKey)}
        >
          <option value="celo">Celo</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="base">Base</option>
        </select>
      </div>

      <div>
        <label>Contract Address</label>
        <input
          value={contractAddr}
          onChange={e => setContractAddr(e.target.value)}
          placeholder="0x..."
        />
      </div>

      <div>
        <label>Token URI (IPFS)</label>
        <input
          value={uri}
          onChange={e => setUri(e.target.value)}
        />

      {mintData && (
        <div style={{
          padding: '10px',
          marginTop: '15px',
          backgroundColor: '#e8f5e9',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <strong>✓ Last Mint:</strong>
          <div>{mintData.txHash.slice(0, 10)}...{mintData.txHash.slice(-8)}</div>
        </div>
      )}

      <SocialAuthPanel mintData={mintData} />
      </div>

      <div>
        <label>Mint Price (ETH)</label>
        <input
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
      </div>

      <button onClick={mint} disabled={loading}>
        {loading ? 'Minting...' : 'Public Mint'}
      </button>
    </div>
  );
}
