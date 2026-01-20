const hre = require('hardhat');
const fs = require('fs');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\n📢 Deploying with account: ${deployer.address}\n`);

  // Contract parameters
  const NFT_NAME = 'MultiChain NFT';
  const NFT_SYMBOL = 'MCNFT';
  const MAX_SUPPLY = 10000;
  const PRICE = hre.ethers.parseEther('0.01'); // 0.01 ETH
  const ROYALTY_RECIPIENT = deployer.address;
  const ROYALTY_PERCENTAGE = 500; // 5% (500 basis points)

  // Deploy MyNFTAdvanced
  console.log('🚀 Deploying MyNFTAdvanced...');
  const MyNFTAdvanced = await hre.ethers.getContractFactory('MyNFTAdvanced');
  const nft = await MyNFTAdvanced.deploy(
    NFT_NAME,
    NFT_SYMBOL,
    MAX_SUPPLY,
    PRICE,
    ROYALTY_RECIPIENT,
    ROYALTY_PERCENTAGE
  );

  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log(`✅ MyNFTAdvanced deployed to: ${nftAddress}\n`);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      MyNFTAdvanced: nftAddress
    },
    config: {
      name: NFT_NAME,
      symbol: NFT_SYMBOL,
      maxSupply: MAX_SUPPLY.toString(),
      price: hre.ethers.formatEther(PRICE),
      royaltyRecipient: ROYALTY_RECIPIENT,
      royaltyPercentage: (ROYALTY_PERCENTAGE / 100).toString() + '%'
    }
  };

  const deploymentPath = `./deployments/${hre.network.name}-deployment.json`;
  const deploymentsDir = './deployments';
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📝 Deployment info saved to: ${deploymentPath}\n`);

  // Verify on block explorer
  if (hre.network.name !== 'hardhat' && hre.network.name !== 'localhost') {
    console.log('🔍 Waiting for block confirmations before verification...');
    await new Promise(r => setTimeout(r, 5000)); // wait 5 seconds

    try {
      console.log('📤 Verifying contract on block explorer...');
      await hre.run('verify:verify', {
        address: nftAddress,
        constructorArguments: [
          NFT_NAME,
          NFT_SYMBOL,
          MAX_SUPPLY,
          PRICE,
          ROYALTY_RECIPIENT,
          ROYALTY_PERCENTAGE
        ]
      });
      console.log('✅ Contract verified!\n');
    } catch (err) {
      console.error('⚠️ Verification failed:', err.message);
    }
  }

  // Display helpful info
  console.log('\n📚 Next steps:');
  console.log(`1. Update frontend with contract address: ${nftAddress}`);
  console.log(`2. Set up Merkle whitelist (if needed) with setMerkleRoot()`);
  console.log(`3. Configure pricing with setPrice() and setWhitelistPrice()`);
  console.log(`4. Test batch minting functions`);
  console.log('\n💡 Useful commands:');
  console.log(`   - Set whitelist: await contract.setMerkleRoot('0x...')`);
  console.log(`   - Batch mint: await contract.batchMint(to, ['uri1', 'uri2', ...])`);
  console.log(`   - Set royalty: await contract.setRoyalty(recipient, percentage)`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
