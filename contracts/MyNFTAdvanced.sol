// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title MyNFTAdvanced - ERC721 with batch minting, whitelist, and royalties
contract MyNFTAdvanced is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 public nextTokenId;
    uint256 public maxSupply;
    uint256 public price;
    bool public publicMintEnabled;
    
    // Whitelist & Merkle Tree
    bytes32 public merkleRoot;
    mapping(address => uint256) public whitelistMinted;
    uint256 public whitelistLimit = 5; // max NFTs per whitelisted address
    uint256 public whitelistPrice; // discounted price for whitelist
    
    // Royalties
    address public royaltyRecipient;
    uint256 public royaltyPercentage; // e.g., 500 = 5%
    
    // Batch minting tracking
    uint256 public totalBatchesMinted;
    
    event Minted(address indexed to, uint256 indexed tokenId);
    event BatchMinted(address indexed to, uint256[] tokenIds);
    event WhitelistUpdated(bytes32 newMerkleRoot);
    event RoyaltySet(address recipient, uint256 percentage);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        uint256 priceWei_,
        address royaltyRecipient_,
        uint256 royaltyPercentage_
    ) ERC721(name_, symbol_) {
        maxSupply = maxSupply_;
        price = priceWei_;
        whitelistPrice = (priceWei_ * 7) / 10; // 30% discount for whitelist
        nextTokenId = 1;
        publicMintEnabled = true;
        royaltyRecipient = royaltyRecipient_;
        royaltyPercentage = royaltyPercentage_;
    }

    /* ==================== Whitelist Functions ==================== */
    
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        emit WhitelistUpdated(_merkleRoot);
    }

    function setWhitelistLimit(uint256 _limit) external onlyOwner {
        whitelistLimit = _limit;
    }

    function verifyWhitelist(
        address account,
        bytes32[] calldata proof
    ) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(account));
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }

    /* ==================== Minting Functions ==================== */
    
    /// @notice Mint single NFT as owner
    function ownerMint(address to, string calldata uri) external onlyOwner returns (uint256) {
        require(nextTokenId <= maxSupply, "max supply reached");
        uint256 id = nextTokenId++;
        _safeMint(to, id);
        _setTokenURI(id, uri);
        emit Minted(to, id);
        return id;
    }

    /// @notice Public mint (regular users)
    function publicMint(string calldata uri) external payable nonReentrant returns (uint256) {
        require(publicMintEnabled, "public mint disabled");
        require(nextTokenId <= maxSupply, "max supply reached");
        require(msg.value >= price, "insufficient payment");

        uint256 id = nextTokenId++;
        _safeMint(msg.sender, id);
        _setTokenURI(id, uri);
        emit Minted(msg.sender, id);
        return id;
    }

    /// @notice Whitelist mint with merkle proof
    function whitelistMint(
        string calldata uri,
        bytes32[] calldata proof
    ) external payable nonReentrant returns (uint256) {
        require(merkleRoot != bytes32(0), "whitelist not set");
        require(verifyWhitelist(msg.sender, proof), "not whitelisted");
        require(whitelistMinted[msg.sender] < whitelistLimit, "whitelist limit reached");
        require(nextTokenId <= maxSupply, "max supply reached");
        require(msg.value >= whitelistPrice, "insufficient payment");

        whitelistMinted[msg.sender]++;
        uint256 id = nextTokenId++;
        _safeMint(msg.sender, id);
        _setTokenURI(id, uri);
        emit Minted(msg.sender, id);
        return id;
    }

    /// @notice Batch mint multiple NFTs at once
    function batchMint(
        address to,
        string[] calldata uris
    ) external onlyOwner returns (uint256[] memory) {
        require(uris.length > 0, "empty batch");
        require(nextTokenId + uris.length <= maxSupply, "exceeds max supply");

        uint256[] memory tokenIds = new uint256[](uris.length);
        
        for (uint256 i = 0; i < uris.length; i++) {
            uint256 id = nextTokenId++;
            _safeMint(to, id);
            _setTokenURI(id, uris[i]);
            tokenIds[i] = id;
        }

        totalBatchesMinted++;
        emit BatchMinted(to, tokenIds);
        return tokenIds;
    }

    /// @notice Batch public mint for multiple users
    function batchPublicMint(
        address[] calldata recipients,
        string[] calldata uris
    ) external payable nonReentrant returns (uint256[] memory) {
        require(publicMintEnabled, "public mint disabled");
        require(recipients.length == uris.length, "mismatched arrays");
        require(recipients.length > 0, "empty batch");
        require(nextTokenId + recipients.length <= maxSupply, "exceeds max supply");

        uint256 totalPrice = price * recipients.length;
        require(msg.value >= totalPrice, "insufficient payment for batch");

        uint256[] memory tokenIds = new uint256[](recipients.length);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 id = nextTokenId++;
            _safeMint(recipients[i], id);
            _setTokenURI(id, uris[i]);
            tokenIds[i] = id;
            emit Minted(recipients[i], id);
        }

        totalBatchesMinted++;
        emit BatchMinted(msg.sender, tokenIds);
        return tokenIds;
    }

    /* ==================== Royalty Functions ==================== */
    
    function setRoyalty(address _recipient, uint256 _percentage) external onlyOwner {
        require(_percentage <= 10000, "percentage too high"); // max 100%
        royaltyRecipient = _recipient;
        royaltyPercentage = _percentage;
        emit RoyaltySet(_recipient, _percentage);
    }

    function getRoyaltyInfo(uint256 _tokenId, uint256 _salePrice) 
        external view 
        returns (address, uint256) 
    {
        _tokenId; // suppress unused param warning
        uint256 royaltyAmount = (_salePrice * royaltyPercentage) / 10000;
        return (royaltyRecipient, royaltyAmount);
    }

    /* ==================== Admin Functions ==================== */
    
    function withdraw(address payable to) external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "no funds");
        to.transfer(bal);
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        price = newPrice;
    }

    function setWhitelistPrice(uint256 newPrice) external onlyOwner {
        whitelistPrice = newPrice;
    }

    function setMaxSupply(uint256 s) external onlyOwner {
        require(s >= nextTokenId - 1, "can't reduce below minted");
        maxSupply = s;
    }

    function togglePublicMint(bool v) external onlyOwner {
        publicMintEnabled = v;
    }

    /* ==================== View Functions ==================== */
    
    function getMintedCount() external view returns (uint256) {
        return nextTokenId - 1;
    }

    function getRemainingSupply() external view returns (uint256) {
        if (nextTokenId > maxSupply) return 0;
        return maxSupply - nextTokenId + 1;
    }

    function getWhitelistMintedCount(address user) external view returns (uint256) {
        return whitelistMinted[user];
    }

    receive() external payable {}
}
