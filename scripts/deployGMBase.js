/**
 * Deploy DailyGMBase Contract to Base Chain
 * 
 * Usage:
 * npx hardhat run scripts/deployGMBase.js --network base
 */

const hre = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('🚀 Deploying DailyGMBase to Base Chain...');

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log(`📍 Deploying from: ${deployer.address}`);

  // Deploy contract
  const DailyGMBase = await hre.ethers.getContractFactory('DailyGMBase');
  
  const contract = await DailyGMBase.deploy(
    'GMBase Daily',               // NFT name
    'GMBASE',                     // NFT symbol
    hre.ethers.parseEther('0.01'), // Daily reward: 0.01 ETH
    5                             // Streak multiplier: 5%
  );

  await contract.waitForDeployment();

  const deployedAddress = await contract.getAddress();

  console.log('✅ DailyGMBase deployed successfully!');
  console.log(`📋 Contract Address: ${deployedAddress}`);
  console.log(`🔗 Base Scan: https://basescan.org/address/${deployedAddress}`);

  // Save deployment address
  const fs = require('fs');
  const deploymentInfo = {
    contract: 'DailyGMBase',
    address: deployedAddress,
    network: 'base',
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    configuration: {
      dailyReward: '0.01 ETH',
      streakMultiplier: '5%',
      gasFeeSubsidy: '0.001 ETH'
    }
  };

  fs.writeFileSync(
    'deployments/gmbase-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('💾 Deployment info saved to deployments/gmbase-deployment.json');

  // Log setup instructions
  console.log('\n📝 Next Steps:');
  console.log(`1. Add to frontend: REACT_APP_GMBASE_CONTRACT=${deployedAddress}`);
  console.log('2. Fund contract with ETH to cover gas subsidies');
  console.log('3. Test with: npx hardhat verify --network base <address>');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
