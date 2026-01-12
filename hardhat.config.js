require('@nomicfoundation/hardhat-toolbox');
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
