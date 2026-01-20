import { ethers } from 'ethers';

/**
 * Generate a Merkle tree root for whitelist verification
 * Usage in smart contract: contract.setMerkleRoot(merkleRoot)
 */
export function generateMerkleRoot(addresses) {
  if (!addresses || addresses.length === 0) {
    throw new Error('Addresses array cannot be empty');
  }

  // Create leaf nodes (keccak256 hash of each address)
  const leaves = addresses.map(addr => {
    if (!ethers.isAddress(addr)) {
      throw new Error(`Invalid address: ${addr}`);
    }
    return ethers.keccak256(ethers.solidityPacked(['address'], [addr]));
  });

  // Build merkle tree bottom-up
  let tree = leaves;
  while (tree.length > 1) {
    const newTree = [];
    for (let i = 0; i < tree.length; i += 2) {
      const left = tree[i];
      const right = i + 1 < tree.length ? tree[i + 1] : tree[i];
      const parent = ethers.keccak256(
        ethers.defaultAbiCoder.encode(
          ['bytes32', 'bytes32'],
          [left, right].sort()
        )
      );
      newTree.push(parent);
    }
    tree = newTree;
  }

  return tree[0];
}

/**
 * Generate Merkle proof for a specific address
 * Usage in smart contract: contract.whitelistMint(uri, proof)
 */
export function generateMerkleProof(addresses, targetAddress) {
  if (!ethers.isAddress(targetAddress)) {
    throw new Error(`Invalid target address: ${targetAddress}`);
  }

  if (!addresses.map(a => a.toLowerCase()).includes(targetAddress.toLowerCase())) {
    throw new Error(`${targetAddress} is not in the whitelist`);
  }

  const leaves = addresses.map(addr =>
    ethers.keccak256(ethers.solidityPacked(['address'], [addr]))
  );

  const targetLeaf = ethers.keccak256(
    ethers.solidityPacked(['address'], [targetAddress])
  );

  const proof = [];
  let tree = leaves;

  while (tree.length > 1) {
    const newTree = [];

    for (let i = 0; i < tree.length; i += 2) {
      const left = tree[i];
      const right = i + 1 < tree.length ? tree[i + 1] : tree[i];

      // Track proof for target leaf
      if (left === targetLeaf) {
        proof.push(right);
      }
      if (right === targetLeaf) {
        proof.push(left);
      }

      const parent = ethers.keccak256(
        ethers.defaultAbiCoder.encode(
          ['bytes32', 'bytes32'],
          [left, right].sort()
        )
      );
      newTree.push(parent);
    }

    // Update target leaf for next level
    if (tree.length % 2 === 1 && tree[tree.length - 1] === targetLeaf) {
      proof.push(tree[tree.length - 2]);
    }

    tree = newTree;
  }

  return proof;
}

/**
 * Verify a merkle proof
 */
export function verifyMerkleProof(address, proof, root) {
  let leaf = ethers.keccak256(ethers.solidityPacked(['address'], [address]));

  for (let i = 0; i < proof.length; i++) {
    const proofElement = proof[i];
    leaf = ethers.keccak256(
      ethers.defaultAbiCoder.encode(
        ['bytes32', 'bytes32'],
        [leaf, proofElement].sort()
      )
    );
  }

  return leaf === root;
}

/**
 * Create whitelist configuration JSON
 */
export function createWhitelistConfig(addresses) {
  const merkleRoot = generateMerkleRoot(addresses);
  const proofs = addresses.reduce((acc, addr) => {
    acc[addr.toLowerCase()] = generateMerkleProof(addresses, addr);
    return acc;
  }, {});

  return {
    merkleRoot,
    whitelist: addresses.map(addr => ({
      address: addr,
      proof: proofs[addr.toLowerCase()]
    }))
  };
}

/**
 * Generate NFT metadata from base URI
 */
export function generateMetadataURI(baseURI, tokenId) {
  return `${baseURI}/${tokenId}`;
}

/**
 * Create batch mint configuration
 */
export function createBatchMintConfig(recipients, metadataBaseURI) {
  return recipients.map((recipient, idx) => ({
    recipient,
    metadataURI: generateMetadataURI(metadataBaseURI, idx + 1)
  }));
}

export default {
  generateMerkleRoot,
  generateMerkleProof,
  verifyMerkleProof,
  createWhitelistConfig,
  generateMetadataURI,
  createBatchMintConfig
};
