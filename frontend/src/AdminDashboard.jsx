import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const ADMIN_ABI = [
  'function owner() view returns (address)',
  'function setPrice(uint256 price)',
  'function setWhitelistPrice(uint256 price)',
  'function setMaxSupply(uint256 supply)',
  'function setRoyalty(address recipient, uint256 percentage)',
  'function setMerkleRoot(bytes32 root)',
  'function setWhitelistLimit(uint256 limit)',
  'function togglePublicMint(bool enabled)',
  'function withdraw(address payable to)',
  'function price() view returns (uint256)',
  'function whitelistPrice() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  'function publicMintEnabled() view returns (bool)',
  'function royaltyRecipient() view returns (address)',
  'function royaltyPercentage() view returns (uint256)',
  'function getMintedCount() view returns (uint256)',
  'function getRemainingSupply() view returns (uint256)'
];

export function AdminDashboard({ signer, contractAddr }) {
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    price: '0',
    whitelistPrice: '0',
    maxSupply: 0,
    minted: 0,
    remaining: 0,
    publicMintEnabled: false,
    royaltyRecipient: '',
    royaltyPercentage: 0
  });

  const [newSettings, setNewSettings] = useState({
    price: '',
    whitelistPrice: '',
    maxSupply: '',
    royaltyRecipient: '',
    royaltyPercentage: '',
    merkleRoot: '',
    whitelistLimit: '',
    publicMintEnabled: true
  });

  const [withdrawAddress, setWithdrawAddress] = useState('');

  useEffect(() => {
    const verifyOwner = async () => {
      if (!signer || !ethers.isAddress(contractAddr)) return;

      try {
        const contract = new ethers.Contract(contractAddr, ADMIN_ABI, signer);
        const signerAddr = await signer.getAddress();
        const owner = await contract.owner();
        setIsOwner(signerAddr.toLowerCase() === owner.toLowerCase());

        if (signerAddr.toLowerCase() === owner.toLowerCase()) {
          await fetchConfig();
        }
      } catch (err) {
        console.error('Failed to verify owner:', err);
      }
    };

    verifyOwner();
  }, [signer, contractAddr]);

  const fetchConfig = async () => {
    if (!signer || !ethers.isAddress(contractAddr)) return;

    try {
      const contract = new ethers.Contract(contractAddr, ADMIN_ABI, signer);
      const [price, whitelistPrice, maxSupply, minted, remaining, publicMintEnabled, royaltyRecipient, royaltyPercentage] = await Promise.all([
        contract.price(),
        contract.whitelistPrice(),
        contract.maxSupply(),
        contract.getMintedCount(),
        contract.getRemainingSupply(),
        contract.publicMintEnabled(),
        contract.royaltyRecipient(),
        contract.royaltyPercentage()
      ]);

      setConfig({
        price: ethers.formatEther(price),
        whitelistPrice: ethers.formatEther(whitelistPrice),
        maxSupply: Number(maxSupply),
        minted: Number(minted),
        remaining: Number(remaining),
        publicMintEnabled,
        royaltyRecipient,
        royaltyPercentage: Number(royaltyPercentage)
      });
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  };

  const handleUpdatePrice = async () => {
    if (!newSettings.price) {
      alert('Enter new price');
      return;
    }

    try {
      setLoading(true);
      const contract = new ethers.Contract(contractAddr, ADMIN_ABI, signer);
      const priceWei = ethers.parseEther(newSettings.price);
      const tx = await contract.setPrice(priceWei);
      await tx.wait();
      alert('✅ Price updated!');
      setNewSettings({ ...newSettings, price: '' });
      await fetchConfig();
    } catch (err) {
      alert(`Error: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWhitelistPrice = async () => {
    if (!newSettings.whitelistPrice) {
      alert('Enter new whitelist price');
      return;
    }

    try {
      setLoading(true);
      const contract = new ethers.Contract(contractAddr, ADMIN_ABI, signer);
      const priceWei = ethers.parseEther(newSettings.whitelistPrice);
      const tx = await contract.setWhitelistPrice(priceWei);
      await tx.wait();
      alert('✅ Whitelist price updated!');
      setNewSettings({ ...newSettings, whitelistPrice: '' });
      await fetchConfig();
    } catch (err) {
      alert(`Error: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublicMint = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(contractAddr, ADMIN_ABI, signer);
      const tx = await contract.togglePublicMint(!config.publicMintEnabled);
      await tx.wait();
      alert(`✅ Public mint ${!config.publicMintEnabled ? 'enabled' : 'disabled'}!`);
      await fetchConfig();
    } catch (err) {
      alert(`Error: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetRoyalty = async () => {
    if (!ethers.isAddress(newSettings.royaltyRecipient) || !newSettings.royaltyPercentage) {
      alert('Enter valid royalty recipient and percentage');
      return;
    }

    try {
      setLoading(true);
      const contract = new ethers.Contract(contractAddr, ADMIN_ABI, signer);
      const percentage = Math.floor(parseFloat(newSettings.royaltyPercentage) * 100); // convert to basis points
      const tx = await contract.setRoyalty(newSettings.royaltyRecipient, percentage);
      await tx.wait();
      alert('✅ Royalty updated!');
      setNewSettings({ ...newSettings, royaltyRecipient: '', royaltyPercentage: '' });
      await fetchConfig();
    } catch (err) {
      alert(`Error: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!ethers.isAddress(withdrawAddress)) {
      alert('Enter valid withdrawal address');
      return;
    }

    try {
      setLoading(true);
      const contract = new ethers.Contract(contractAddr, ADMIN_ABI, signer);
      const tx = await contract.withdraw(withdrawAddress);
      const receipt = await tx.wait();
      alert(`✅ Funds withdrawn!\nTx: ${receipt.hash}`);
      setWithdrawAddress('');
    } catch (err) {
      alert(`Error: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) {
    return (
      <div style={styles.container}>
        <div style={styles.warningBox}>
          ⚠️ Admin dashboard only accessible to contract owner
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>⚙️ Admin Dashboard</h2>

      {/* Current Config */}
      <div style={styles.configBox}>
        <h3>📋 Current Configuration</h3>
        <div style={styles.grid3}>
          <div>
            <strong>Mint Price:</strong> {config.price} ETH
          </div>
          <div>
            <strong>Whitelist Price:</strong> {config.whitelistPrice} ETH
          </div>
          <div>
            <strong>Max Supply:</strong> {config.maxSupply}
          </div>
          <div>
            <strong>Minted:</strong> {config.minted}
          </div>
          <div>
            <strong>Remaining:</strong> {config.remaining}
          </div>
          <div>
            <strong>Public Mint:</strong> {config.publicMintEnabled ? '✅ Enabled' : '❌ Disabled'}
          </div>
        </div>
        {config.royaltyRecipient !== '0x0000000000000000000000000000000000000000' && (
          <div style={{ marginTop: '15px' }}>
            <div>
              <strong>Royalty Recipient:</strong> {config.royaltyRecipient.slice(0, 6)}...{config.royaltyRecipient.slice(-4)}
            </div>
            <div>
              <strong>Royalty Percentage:</strong> {(config.royaltyPercentage / 100).toFixed(2)}%
            </div>
          </div>
        )}
      </div>

      {/* Settings */}
      <div style={styles.section}>
        <h3>💰 Pricing</h3>
        <div style={styles.inputGroup}>
          <input
            type="number"
            step="0.001"
            value={newSettings.price}
            onChange={(e) => setNewSettings({ ...newSettings, price: e.target.value })}
            placeholder="New price (ETH)"
            style={styles.input}
          />
          <button onClick={handleUpdatePrice} disabled={loading} style={styles.button}>
            Update Price
          </button>
        </div>

        <div style={styles.inputGroup}>
          <input
            type="number"
            step="0.001"
            value={newSettings.whitelistPrice}
            onChange={(e) => setNewSettings({ ...newSettings, whitelistPrice: e.target.value })}
            placeholder="Whitelist price (ETH)"
            style={styles.input}
          />
          <button onClick={handleUpdateWhitelistPrice} disabled={loading} style={styles.button}>
            Update Whitelist Price
          </button>
        </div>
      </div>

      {/* Royalties */}
      <div style={styles.section}>
        <h3>👑 Royalties</h3>
        <div style={styles.inputGroup}>
          <input
            value={newSettings.royaltyRecipient}
            onChange={(e) => setNewSettings({ ...newSettings, royaltyRecipient: e.target.value })}
            placeholder="Royalty recipient address (0x...)"
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={newSettings.royaltyPercentage}
            onChange={(e) => setNewSettings({ ...newSettings, royaltyPercentage: e.target.value })}
            placeholder="Royalty % (0-100)"
            style={styles.input}
          />
          <button onClick={handleSetRoyalty} disabled={loading} style={styles.button}>
            Set Royalty
          </button>
        </div>
      </div>

      {/* Minting Control */}
      <div style={styles.section}>
        <h3>🎯 Minting Control</h3>
        <button
          onClick={handleTogglePublicMint}
          disabled={loading}
          style={{
            ...styles.button,
            backgroundColor: config.publicMintEnabled ? '#dc3545' : '#28a745'
          }}
        >
          {config.publicMintEnabled ? '❌ Disable Public Mint' : '✅ Enable Public Mint'}
        </button>
      </div>

      {/* Withdrawal */}
      <div style={styles.section}>
        <h3>💸 Withdraw Funds</h3>
        <div style={styles.inputGroup}>
          <input
            value={withdrawAddress}
            onChange={(e) => setWithdrawAddress(e.target.value)}
            placeholder="Withdrawal address (0x...)"
            style={styles.input}
          />
          <button onClick={handleWithdraw} disabled={loading} style={{...styles.button, backgroundColor: '#ffc107'}}>
            Withdraw
          </button>
        </div>
      </div>

      <button onClick={fetchConfig} disabled={loading} style={{...styles.button, marginTop: '20px'}}>
        🔄 Refresh
      </button>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginTop: '20px',
    border: '1px solid #dee2e6'
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    padding: '15px',
    borderRadius: '6px',
    border: '1px solid #ffeaa7',
    color: '#856404'
  },
  configBox: {
    backgroundColor: '#e7f3ff',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '20px',
    border: '1px solid #bee5eb'
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
    marginTop: '10px'
  },
  section: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '6px'
  },
  inputGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px'
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '14px'
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default AdminDashboard;
