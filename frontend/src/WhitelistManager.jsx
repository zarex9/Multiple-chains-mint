import React, { useState, useRef } from 'react';
import { ethers } from 'ethers';

const WHITELIST_ABI = [
  'function setMerkleRoot(bytes32 root)',
  'function setWhitelistLimit(uint256 limit)',
  'function verifyWhitelist(address account, bytes32[] proof) view returns (bool)',
  'function getWhitelistMintedCount(address user) view returns (uint256)'
];

/**
 * Simple Merkle tree implementation for frontend
 */
class SimpleMerkleTree {
  constructor(addresses) {
    this.addresses = addresses.map(a => a.toLowerCase());
    this.leaves = this.addresses.map(addr =>
      ethers.keccak256(ethers.solidityPacked(['address'], [addr]))
    );
    this.tree = this.buildTree(this.leaves);
    this.root = this.tree[0];
  }

  buildTree(leaves) {
    let tree = leaves;
    const layers = [];

    while (tree.length > 1) {
      layers.push(tree);
      const newTree = [];

      for (let i = 0; i < tree.length; i += 2) {
        const left = tree[i];
        const right = i + 1 < tree.length ? tree[i + 1] : tree[i];
        const parent = ethers.keccak256(
          ethers.defaultAbiCoder.encode(['bytes32', 'bytes32'], [left, right].sort())
        );
        newTree.push(parent);
      }
      tree = newTree;
    }
    layers.push(tree);
    return layers;
  }

  getProof(address) {
    const targetAddr = address.toLowerCase();
    if (!this.addresses.includes(targetAddr)) {
      return null;
    }

    let targetLeaf = ethers.keccak256(ethers.solidityPacked(['address'], [address]));
    const proof = [];

    for (let layer of this.tree) {
      const index = layer.indexOf(targetLeaf);
      if (index === -1) continue;

      const sibling = index % 2 === 0 ? layer[index + 1] : layer[index - 1];
      if (sibling) proof.push(sibling);

      targetLeaf = ethers.keccak256(
        ethers.defaultAbiCoder.encode(['bytes32', 'bytes32'], [targetLeaf, sibling || targetLeaf].sort())
      );
    }

    return proof;
  }
}

export function WhitelistManager({ signer, contractAddr }) {
  const [whitelistAddresses, setWhitelistAddresses] = useState(['']);
  const [merkleData, setMerkleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [whitelistLimit, setWhitelistLimit] = useState('5');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedProof, setSelectedProof] = useState(null);
  const fileInputRef = useRef(null);

  const handleAddAddress = () => {
    setWhitelistAddresses([...whitelistAddresses, '']);
  };

  const handleRemoveAddress = (idx) => {
    setWhitelistAddresses(whitelistAddresses.filter((_, i) => i !== idx));
  };

  const handleUpdateAddress = (idx, value) => {
    const newAddresses = [...whitelistAddresses];
    newAddresses[idx] = value;
    setWhitelistAddresses(newAddresses);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const addresses = (event.target?.result)
        .split('\n')
        .map(line => line.trim())
        .filter(line => ethers.isAddress(line));

      if (addresses.length > 0) {
        setWhitelistAddresses(addresses);
      }
    };
    reader.readAsText(file);
  };

  const generateMerkleTree = () => {
    const validAddresses = whitelistAddresses
      .map(a => a.trim())
      .filter(a => ethers.isAddress(a));

    if (validAddresses.length === 0) {
      alert('Add at least one valid address');
      return;
    }

    try {
      const tree = new SimpleMerkleTree(validAddresses);
      const whitelist = validAddresses.map(addr => ({
        address: addr,
        proof: tree.getProof(addr)
      }));

      setMerkleData({
        root: tree.root,
        whitelist,
        count: validAddresses.length
      });

      alert(`✅ Merkle tree generated for ${validAddresses.length} addresses`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSetMerkleRoot = async () => {
    if (!merkleData) {
      alert('Generate Merkle tree first');
      return;
    }

    if (!signer || !ethers.isAddress(contractAddr)) {
      alert('Connect wallet first');
      return;
    }

    try {
      setLoading(true);
      const contract = new ethers.Contract(contractAddr, WHITELIST_ABI, signer);
      const tx = await contract.setMerkleRoot(merkleData.root);
      const receipt = await tx.wait();

      alert(`✅ Merkle root set!\nTx: ${receipt.hash}`);
    } catch (err) {
      alert(`Error: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetWhitelistLimit = async () => {
    if (!whitelistLimit) {
      alert('Enter whitelist limit');
      return;
    }

    if (!signer || !ethers.isAddress(contractAddr)) {
      alert('Connect wallet first');
      return;
    }

    try {
      setLoading(true);
      const contract = new ethers.Contract(contractAddr, WHITELIST_ABI, signer);
      const tx = await contract.setWhitelistLimit(parseInt(whitelistLimit));
      const receipt = await tx.wait();

      alert(`✅ Whitelist limit updated to ${whitelistLimit}!\nTx: ${receipt.hash}`);
    } catch (err) {
      alert(`Error: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadWhitelistConfig = () => {
    if (!merkleData) {
      alert('Generate Merkle tree first');
      return;
    }

    const config = {
      merkleRoot: merkleData.root,
      timestamp: new Date().toISOString(),
      whitelist: merkleData.whitelist
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whitelist-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectAddress = (addr) => {
    setSelectedAddress(addr);
    const entry = merkleData.whitelist.find(w => w.address.toLowerCase() === addr.toLowerCase());
    setSelectedProof(entry?.proof || null);
  };

  return (
    <div style={styles.container}>
      <h2>🎯 Whitelist Manager</h2>

      {/* Whitelist Input */}
      <div style={styles.section}>
        <h3>📝 Add Addresses</h3>

        <button onClick={() => fileInputRef.current?.click()} style={{...styles.button, marginBottom: '10px'}}>
          📁 Load from File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.csv,.json"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        {whitelistAddresses.map((addr, idx) => (
          <div key={idx} style={styles.inputRow}>
            <input
              value={addr}
              onChange={(e) => handleUpdateAddress(idx, e.target.value)}
              placeholder="0x..."
              style={styles.input}
            />
            {whitelistAddresses.length > 1 && (
              <button
                onClick={() => handleRemoveAddress(idx)}
                style={{...styles.smallButton, backgroundColor: '#dc3545'}}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button
          onClick={handleAddAddress}
          style={{...styles.smallButton, backgroundColor: '#28a745', marginTop: '10px'}}
        >
          + Add Address
        </button>
      </div>

      {/* Generate Merkle Tree */}
      <div style={styles.section}>
        <h3>🌳 Merkle Tree</h3>
        <button
          onClick={generateMerkleTree}
          style={{...styles.button, backgroundColor: '#17a2b8'}}
        >
          🔨 Generate Merkle Tree
        </button>

        {merkleData && (
          <div style={styles.resultBox}>
            <p>
              <strong>✅ Root:</strong> <code style={styles.code}>{merkleData.root.slice(0, 20)}...{merkleData.root.slice(-18)}</code>
            </p>
            <p>
              <strong>📊 Addresses:</strong> {merkleData.count}
            </p>
          </div>
        )}
      </div>

      {/* Whitelist Config */}
      {merkleData && (
        <div style={styles.section}>
          <h3>📋 Whitelist Configuration</h3>

          <div style={styles.selectContainer}>
            <select
              value={selectedAddress}
              onChange={(e) => handleSelectAddress(e.target.value)}
              style={styles.select}
            >
              <option value="">Select an address...</option>
              {merkleData.whitelist.map((item, idx) => (
                <option key={idx} value={item.address}>
                  {item.address.slice(0, 10)}...{item.address.slice(-8)}
                </option>
              ))}
            </select>
          </div>

          {selectedProof && (
            <div style={styles.proofBox}>
              <strong>Merkle Proof for {selectedAddress.slice(0, 10)}...:</strong>
              <code style={{...styles.code, display: 'block', wordBreak: 'break-all'}}>
                {JSON.stringify(selectedProof, null, 2)}
              </code>
            </div>
          )}

          <button
            onClick={downloadWhitelistConfig}
            style={{...styles.button, backgroundColor: '#ffc107', color: '#000'}}
          >
            💾 Download Whitelist Config
          </button>
        </div>
      )}

      {/* Smart Contract Setup */}
      <div style={styles.section}>
        <h3>⚙️ Smart Contract Setup</h3>

        <div style={styles.inputRow}>
          <input
            type="number"
            min="1"
            value={whitelistLimit}
            onChange={(e) => setWhitelistLimit(e.target.value)}
            placeholder="Max mints per whitelisted user"
            style={styles.input}
          />
          <button
            onClick={handleSetWhitelistLimit}
            disabled={loading}
            style={styles.button}
          >
            Set Limit
          </button>
        </div>

        <button
          onClick={handleSetMerkleRoot}
          disabled={loading || !merkleData}
          style={{...styles.button, backgroundColor: merkleData ? '#28a745' : '#cccccc', marginTop: '10px'}}
        >
          {loading ? '⏳ Setting...' : '✅ Set Merkle Root on Contract'}
        </button>
      </div>
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
  section: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '6px'
  },
  inputRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px'
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
  resultBox: {
    backgroundColor: '#d4edda',
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #c3e6cb',
    marginTop: '10px'
  },
  proofBox: {
    backgroundColor: '#e7f3ff',
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #bee5eb',
    marginTop: '10px',
    marginBottom: '10px'
  },
  code: {
    fontFamily: 'monospace',
    fontSize: '12px',
    backgroundColor: '#f5f5f5',
    padding: '8px',
    borderRadius: '4px',
    display: 'inline-block',
    maxWidth: '100%',
    overflow: 'auto'
  },
  selectContainer: {
    marginBottom: '15px'
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  }
};

export default WhitelistManager;
