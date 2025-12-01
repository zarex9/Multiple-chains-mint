import React, { useState } from 'react';
import { ethers } from 'ethers';
import WalletConnectProvider from "@walletconnect/ethereum-provider";

const CONTRACT_ABI = [
  'function publicMint(string uri) payable returns (uint256)',
  'function ownerMint(address to, string uri) external returns (uint256)'
];

const NETWORKS = {
  celo: { chainId: 42220, name: 'Celo', rpc: process.env.REACT_APP_CELO_RPC },
  arbitrum: { chainId: 42161, name: 'Arbitrum', rpc: process.env.REACT_APP_ARB_RPC },
  base: { chainId: 8453, name: 'Base', rpc: process.env.REACT_APP_BASE_RPC }
};

export default function App() {
  const [signer, setSigner] = useState(null);
  const [network, setNetwork] = useState('celo');
  const [contractAddr, setContractAddr] = useState('');
  const [uri, setUri] = useState('https://ipfs.io/ipfs/<CID>');
  const [price, setPrice] = useState('0.01');

  async function connectWallet() {
    const nw = NETWORKS[network];

    const wc = await WalletConnectProvider.init({
      projectId: process.env.REACT_APP_WALLETCONNECT_ID,
      chains: [nw.chainId],
      optionalChains: [nw.chainId],
      rpcMap: { [nw.chainId]: nw.rpc }
    });

    await wc.connect();
    const provider = new ethers.BrowserProvider(wc);
    const s = await provider.getSigner();
    setSigner(s);
  }

  async function mint() {
    if (!signer) return alert('Connect wallet first');
    if (!contractAddr) return alert('Enter contract address');

    const priceWei = ethers.parseEther(price);
    const contract = new ethers.Contract(contractAddr, CONTRACT_ABI, signer);

    const tx = await contract.publicMint(uri, { value: priceWei });
    await tx.wait();

    alert('Minted successfully! Tx: ' + tx.hash);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>MultiChain NFT Minter (Celo / Arbitrum / Base)</h2>

      <button onClick={connectWallet}>Connect Wallet</button>

      <div>
        <label>Network:</label>
        <select value={network} onChange={e => setNetwork(e.target.value)}>
          <option value="celo">Celo</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="base">Base</option>
        </select>
      </div>

      <div>
        <label>Contract:</label>
        <input value={contractAddr} onChange={e => setContractAddr(e.target.value)} />
      </div>

      <div>
        <label>Token URI (IPFS):</label>
        <input value={uri} onChange={e => setUri(e.target.value)} />
      </div>

      <div>
        <label>Mint Price:</label>
        <input value={price} onChange={e => setPrice(e.target.value)} />
      </div>

      <button onClick={mint}>Public Mint</button>
    </div>
  );
}
