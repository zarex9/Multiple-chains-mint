const hre = require('hardhat');

function parseUnitsSafe(value, unit = 'ether') {
  // Support both ethers v6 (hre.ethers.parseUnits) and v5 (hre.ethers.utils.parseUnits)
  if (!value) value = '0.01';
  try {
    if (typeof hre.ethers.parseUnits === 'function') {
      return hre.ethers.parseUnits(value, unit);
    }
  } catch (e) {
    // fallthrough
  }
  // fallback to utils (ethers v5)
  if (hre.ethers && hre.ethers.utils && typeof hre.ethers.utils.parseUnits === 'function') {
    return hre.ethers.utils.parseUnits(value, unit);
  }
  // As a last resort, try ethers v6 global parse
  if (typeof require('ethers').parseUnits === 'function') {
    return require('ethers').parseUnits(value, unit);
  }
  throw new Error('No parseUnits available from ethers');
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with', deployer.address, 'on', hre.network.name);

  const name = process.env.NFT_NAME || 'MultiChainNFT';
  const symbol = process.env.NFT_SYMBOL || 'MCN';
  const maxSupply = parseInt(process.env.MAX_SUPPLY || '1000');
  const price = parseUnitsSafe(process.env.MINT_PRICE || '0.01', 'ether');

  const MyNFT = await hre.ethers.getContractFactory('MyNFT');
  const nft = await MyNFT.deploy(name, symbol, maxSupply, price);
  await nft.deployed();
  console.log('Deployed NFT at', nft.address);

  // show example verify command
  console.log('\nVerify with:');
  console.log(`npx hardhat verify --network ${hre.network.name} ${nft.address} "${name}" "${symbol}" ${maxSupply} ${price.toString()}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
