// Integration Guide for App.jsx
// This shows how to integrate all new components into your existing App.jsx

import React, { useState } from 'react';
import { ethers } from 'ethers';
import WalletConnectProvider from '@walletconnect/ethereum-provider';

// Import new components
import BatchMintingUI from './BatchMintingUI';
import AdminDashboard from './AdminDashboard';
import WhitelistManager from './WhitelistManager';

/* Contract ABI - Updated for advanced features */
const ADVANCED_CONTRACT_ABI = [
  'function publicMint(string uri) payable returns (uint256)',
  'function whitelistMint(string uri, bytes32[] proof) payable returns (uint256)',
  'function batchMint(address to, string[] uris) returns (uint256[])',
  'function batchPublicMint(address[] recipients, string[] uris) payable returns (uint256[])',
  'function setMerkleRoot(bytes32 root)',
  'function setWhitelistLimit(uint256 limit)',
  'function setPrice(uint256 price)',
  'function setWhitelistPrice(uint256 price)',
  'function setRoyalty(address recipient, uint256 percentage)',
  'function togglePublicMint(bool enabled)',
  'function getMintedCount() view returns (uint256)',
  'function getRemainingSupply() view returns (uint256)',
  'function getWhitelistMintedCount(address user) view returns (uint256)',
  'function price() view returns (uint256)',
  'function whitelistPrice() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  'function publicMintEnabled() view returns (bool)',
  'function owner() view returns (address)',
  'function royaltyRecipient() view returns (address)',
  'function royaltyPercentage() view returns (uint256)'
];

type NetworkKey = 'celo' | 'arbitrum' | 'base';

const NETWORKS: Record<NetworkKey, { chainId: number; name: string; rpc?: string }> = {
  celo: { chainId: 42220, name: 'Celo', rpc: process.env.REACT_APP_CELO_RPC },
  arbitrum: { chainId: 42161, name: 'Arbitrum', rpc: process.env.REACT_APP_ARB_RPC },
  base: { chainId: 8453, name: 'Base', rpc: process.env.REACT_APP_BASE_RPC }
};

// Contract addresses - UPDATE THESE
const CONTRACT_ADDRESSES: Record<NetworkKey, string> = {
  celo: process.env.REACT_APP_CELO_CONTRACT || '',
  arbitrum: process.env.REACT_APP_ARB_CONTRACT || '',
  base: process.env.REACT_APP_BASE_CONTRACT || ''
};

export default function App() {
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [network, setNetwork] = useState<NetworkKey>('celo');
  const [currentTab, setCurrentTab] = useState<'mint' | 'batch' | 'whitelist' | 'admin'>('mint');

  const contractAddr = CONTRACT_ADDRESSES[network];

  /* ==================== Wallet Connection ==================== */
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

      alert(`✅ Connected to ${nw.name}`);
    } catch (err) {
      console.error(err);
      alert('Wallet connection failed');
    }
  }

  function disconnectWallet() {
    setSigner(null);
    setProvider(null);
    alert('Wallet disconnected');
  }

  /* ==================== Render Single Mint Form ==================== */
  function renderSingleMintForm() {
    const [uri, setUri] = useState('https://ipfs.io/ipfs/<CID>');
    const [price, setPrice] = useState('0.01');
    const [loading, setLoading] = useState(false);

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
        const contract = new ethers.Contract(contractAddr, ADVANCED_CONTRACT_ABI, signer);
        const tx = await contract.publicMint(uri, { value: priceWei });
        const receipt = await tx.wait();
        alert(`✅ Minted! Tx: ${receipt?.hash}`);
        setUri('https://ipfs.io/ipfs/<CID>');
      } catch (err) {
        alert(`Error: ${err.reason || err.message}`);
      } finally {
        setLoading(false);
      }
    }

    return (
      <div style={styles.formContainer}>
        <h3>👤 Single NFT Mint</h3>
        <input
          type="text"
          value={uri}
          onChange={(e) => setUri(e.target.value)}
          placeholder="Metadata URI (ipfs://... or https://...)"
          style={styles.input}
        />
        <input
          type="number"
          step="0.001"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price (ETH)"
          style={styles.input}
        />
        <button onClick={mint} disabled={loading} style={styles.button}>
          {loading ? '⏳ Minting...' : '🎨 Mint NFT'}
        </button>
      </div>
    );
  }

  /* ==================== Main Render ==================== */
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>🚀 Multi-Chain NFT Minting Platform</h1>
        <p>Batch Minting | Whitelist Management | Admin Controls</p>
      </header>

      {/* Network & Wallet */}
      <div style={styles.topBar}>
        <div style={styles.networkSelect}>
          <label>Network: </label>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value as NetworkKey)}
            disabled={!!signer}
            style={styles.select}
          >
            <option value="celo">🟨 Celo</option>
            <option value="arbitrum">🔵 Arbitrum</option>
            <option value="base">⚪ Base</option>
          </select>
        </div>

        {signer ? (
          <button onClick={disconnectWallet} style={styles.disconnectButton}>
            🔓 Disconnect
          </button>
        ) : (
          <button onClick={connectWallet} style={styles.connectButton}>
            🔗 Connect Wallet
          </button>
        )}
      </div>

      {/* Alerts */}
      {!contractAddr && (
        <div style={styles.alertBox}>
          ⚠️ Contract address not configured for {NETWORKS[network].name}. Update CONTRACT_ADDRESSES.
        </div>
      )}

      {signer && (
        <div style={styles.successBox}>
          ✅ Wallet connected! Ready to mint on {NETWORKS[network].name}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={styles.tabNavigation}>
        <button
          onClick={() => setCurrentTab('mint')}
          style={{...styles.tabButton, ...(currentTab === 'mint' ? styles.tabButtonActive : {})}}
        >
          👤 Single Mint
        </button>
        <button
          onClick={() => setCurrentTab('batch')}
          style={{...styles.tabButton, ...(currentTab === 'batch' ? styles.tabButtonActive : {})}}
        >
          📦 Batch Mint
        </button>
        <button
          onClick={() => setCurrentTab('whitelist')}
          style={{...styles.tabButton, ...(currentTab === 'whitelist' ? styles.tabButtonActive : {})}}
        >
          🎯 Whitelist
        </button>
        <button
          onClick={() => setCurrentTab('admin')}
          style={{...styles.tabButton, ...(currentTab === 'admin' ? styles.tabButtonActive : {})}}
        >
          ⚙️ Admin
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {currentTab === 'mint' && renderSingleMintForm()}

        {currentTab === 'batch' && (
          <BatchMintingUI
            signer={signer}
            provider={provider}
            contractAddr={contractAddr}
            network={network}
          />
        )}

        {currentTab === 'whitelist' && (
          <WhitelistManager signer={signer} contractAddr={contractAddr} />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard signer={signer} contractAddr={contractAddr} />
        )}
      </div>

      {/* Documentation */}
      <div style={styles.footer}>
        <h3>📚 Documentation</h3>
        <p>See [ADVANCED_FEATURES.md](ADVANCED_FEATURES.md) for complete documentation</p>
        <p>See [QUICK_START.md](QUICK_START.md) for quick reference</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #007bff'
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  networkSelect: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '14px'
  },
  connectButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  disconnectButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  alertBox: {
    backgroundColor: '#fff3cd',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
    color: '#856404'
  },
  successBox: {
    backgroundColor: '#d4edda',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
    color: '#155724'
  },
  tabNavigation: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  tabButton: {
    padding: '10px 16px',
    backgroundColor: '#e9ecef',
    color: '#000',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  tabButtonActive: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: '1px solid #007bff'
  },
  tabContent: {
    marginBottom: '40px'
  },
  formContainer: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px'
  },
  input: {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '10px'
  },
  footer: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center'
  }
};
