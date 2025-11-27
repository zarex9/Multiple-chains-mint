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
