import React, { useState, useRef } from 'react';
import { ethers } from 'ethers';

const ADVANCED_ABI = [
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
  'function publicMintEnabled() view returns (bool)'
];

export function BatchMintingUI({ signer, provider, contractAddr, network }) {
  const [batchMode, setBatchMode] = useState(false);
  const [uris, setUris] = useState(['']);
  const [recipients, setRecipients] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ minted: 0, remaining: 0, price: '0' });

  const fileInputRef = useRef(null);

  // Fetch contract stats
  const fetchStats = async () => {
    if (!signer || !ethers.isAddress(contractAddr)) return;
    
    try {
      const contract = new ethers.Contract(contractAddr, ADVANCED_ABI, signer);
      const [minted, remaining, price] = await Promise.all([
        contract.getMintedCount(),
        contract.getRemainingSupply(),
        contract.price()
      ]);
      
      setStats({
        minted: Number(minted),
        remaining: Number(remaining),
        price: ethers.formatEther(price)
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, [contractAddr, signer]);

  const addUriField = () => setUris([...uris, '']);
  const removeUriField = (idx) => setUris(uris.filter((_, i) => i !== idx));
  const updateUri = (idx, val) => {
    const newUris = [...uris];
    newUris[idx] = val;
    setUris(newUris);
  };

  const addRecipientField = () => setRecipients([...recipients, '']);
  const removeRecipientField = (idx) => setRecipients(recipients.filter((_, i) => i !== idx));
  const updateRecipient = (idx, val) => {
    const newRecipients = [...recipients];
    newRecipients[idx] = val;
    setRecipients(newRecipients);
  };

  const handleBatchMint = async () => {
    if (!signer) {
      alert('Connect wallet first');
      return;
    }

    const validUris = uris.filter(u => u.trim());
    if (validUris.length === 0) {
      alert('Add at least one URI');
      return;
    }

    try {
      setLoading(true);
      const contract = new ethers.Contract(contractAddr, ADVANCED_ABI, signer);
      const signerAddr = await signer.getAddress();

      const tx = await contract.batchMint(signerAddr, validUris);
      const receipt = await tx.wait();

      alert(`✅ Batch minted ${validUris.length} NFTs!\nTx: ${receipt.hash}`);
      setUris(['']);
      fetchStats();
    } catch (err) {
      console.error('Batch mint failed:', err);
      alert(`Error: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchPublicMint = async () => {
    if (!signer) {
      alert('Connect wallet first');
      return;
    }

    const validRecipients = recipients.filter(r => ethers.isAddress(r));
    const validUris = uris.filter(u => u.trim());

    if (validRecipients.length === 0 || validUris.length === 0) {
      alert('Add at least one recipient and URI');
      return;
    }

    if (validRecipients.length !== validUris.length) {
      alert('Recipients and URIs must have same count');
      return;
    }

    try {
      setLoading(true);
      const contract = new ethers.Contract(contractAddr, ADVANCED_ABI, signer);
      const totalPrice = ethers.parseEther((stats.price * validRecipients.length).toString());

      const tx = await contract.batchPublicMint(validRecipients, validUris, {
        value: totalPrice
      });
      const receipt = await tx.wait();

      alert(`✅ Batch minted ${validRecipients.length} NFTs!\nTx: ${receipt.hash}`);
      setRecipients(['']);
      setUris(['']);
      fetchStats();
    } catch (err) {
      console.error('Batch public mint failed:', err);
      alert(`Error: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const lines = (event.target?.result as string)
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && (l.startsWith('http') || l.startsWith('ipfs://')));
      
      if (lines.length > 0) {
        setUris(lines);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={styles.container}>
      <h2>🚀 Advanced Minting</h2>
      
      {/* Stats */}
      <div style={styles.statsBox}>
        <div>📊 Minted: <strong>{stats.minted}</strong></div>
        <div>📈 Remaining: <strong>{stats.remaining}</strong></div>
        <div>💰 Price: <strong>{stats.price} ETH</strong></div>
      </div>

      {/* Mode Toggle */}
      <div style={styles.toggleGroup}>
        <button
          style={{...styles.button, backgroundColor: !batchMode ? '#007bff' : '#6c757d'}}
          onClick={() => setBatchMode(false)}
        >
          👤 Single Mint
        </button>
        <button
          style={{...styles.button, backgroundColor: batchMode ? '#007bff' : '#6c757d'}}
          onClick={() => setBatchMode(true)}
        >
          📦 Batch Mint
        </button>
      </div>

      {batchMode ? (
        <div>
          <h3>📦 Batch Minting Mode</h3>
          
          {/* URIs */}
          <div style={styles.section}>
            <label style={styles.label}>
              <input type="checkbox" checked={batchMode} onChange={() => setBatchMode(false)} disabled />
              <strong> Metadata URIs ({uris.filter(u => u.trim()).length})</strong>
            </label>
            <button onClick={() => fileInputRef.current?.click()} style={{...styles.smallButton, marginBottom: '10px'}}>
              📁 Load from File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            
            {uris.map((uri, idx) => (
              <div key={idx} style={styles.inputRow}>
                <input
                  value={uri}
                  onChange={(e) => updateUri(idx, e.target.value)}
                  placeholder="ipfs://... or https://..."
                  style={styles.input}
                />
                {uris.length > 1 && (
                  <button onClick={() => removeUriField(idx)} style={{...styles.smallButton, backgroundColor: '#dc3545'}}>
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button onClick={addUriField} style={{...styles.smallButton, backgroundColor: '#28a745'}}>
              + Add URI
            </button>
          </div>

          {/* Recipients or Self */}
          <div style={styles.section}>
            <label style={styles.label}>
              <strong>🎁 Recipients ({recipients.filter(r => ethers.isAddress(r)).length})</strong>
            </label>
            {recipients.map((addr, idx) => (
              <div key={idx} style={styles.inputRow}>
                <input
                  value={addr}
                  onChange={(e) => updateRecipient(idx, e.target.value)}
                  placeholder="0x... address"
                  style={styles.input}
                />
                {recipients.length > 1 && (
                  <button onClick={() => removeRecipientField(idx)} style={{...styles.smallButton, backgroundColor: '#dc3545'}}>
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button onClick={addRecipientField} style={{...styles.smallButton, backgroundColor: '#28a745'}}>
              + Add Recipient
            </button>
          </div>

          <button
            onClick={handleBatchPublicMint}
            disabled={loading}
            style={{...styles.button, ...{backgroundColor: loading ? '#cccccc' : '#28a745'}}}
          >
            {loading ? '⏳ Minting...' : `✅ Batch Mint ${uris.filter(u => u.trim()).length} NFTs`}
          </button>
        </div>
      ) : (
        <div>
          <h3>👤 Single Mint (see main minting form)</h3>
          <p>Switch to main minting form above for single NFT minting.</p>
        </div>
      )}
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
  statsBox: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '6px',
    border: '1px solid #e9ecef'
  },
  toggleGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  smallButton: {
    padding: '6px 12px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  section: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '6px'
  },
  label: {
    display: 'block',
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
    alignItems: 'center'
  }
};

export default BatchMintingUI;
