// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title MyNFT - simple ERC721 with owner mint + public mint
contract MyNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
        uint256 public nextTokenId;
            uint256 public maxSupply;
                uint256 public price;
                    bool public publicMintEnabled;

                        event Minted(address indexed to, uint256 indexed tokenId);

                            constructor(string memory name_, string memory symbol_, uint256 maxSupply_, uint256 priceWei_) ERC721(name_, symbol_) {
                                        maxSupply = maxSupply_;
                                                price = priceWei_;
                                                        nextTokenId = 1; // start at 1
                                                                publicMintEnabled = true;
                            }

                                function ownerMint(address to, string calldata uri) external onlyOwner returns (uint256) {
                                            require(nextTokenId <= maxSupply, "max supply reached");
                                                    uint256 id = nextTokenId++;
                                                            _safeMint(to, id);
                                                                    _setTokenURI(id, uri);
                                                                            emit Minted(to, id);
                                                                                    return id;
                                }

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

                                        function withdraw(address payable to) external onlyOwner {
                                                    uint256 bal = address(this).balance;
                                                            require(bal > 0, "no funds");
                                                                    to.transfer(bal);
                                        }

                                            function setPrice(uint256 newPrice) external onlyOwner { price = newPrice; }
                                                function setMaxSupply(uint256 s) external onlyOwner { maxSupply = s; }
                                                    function togglePublicMint(bool v) external onlyOwner { publicMintEnabled = v; }

                                                        // allow receiving native tokens
                                                            receive() external payable {}
}
