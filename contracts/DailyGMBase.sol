// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title DailyGMBase - Daily click rewards on Base chain
contract DailyGMBase is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 public nextTokenId;
    uint256 public rewardAmount;
    uint256 public dailyClickReward;
    uint256 public streakMultiplier;

    // Track last click timestamp for each user
    mapping(address => uint256) public lastClickTimestamp;
    
    // Track consecutive days for streak bonuses
    mapping(address => uint256) public clickStreak;
    
    // Track total clicks per user
    mapping(address => uint256) public totalClicks;
    
    // Track rewards earned
    mapping(address => uint256) public rewardsEarned;

    event DailyClick(
        address indexed user,
        uint256 indexed tokenId,
        uint256 reward,
        uint256 streak,
        uint256 timestamp
    );
    
    event StreakBroken(address indexed user, uint256 lastStreak);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 dailyReward_,
        uint256 streakMultiplier_
    ) ERC721(name_, symbol_) {
        nextTokenId = 1;
        dailyClickReward = dailyReward_;
        streakMultiplier = streakMultiplier_;
        rewardAmount = 0.001 ether; // Base gas fee subsidy
    }

    /// @notice User performs daily click - can only click once per 24 hours
    function dailyClick(string calldata metadata) external payable nonReentrant returns (uint256) {
        require(msg.value >= rewardAmount, "Insufficient payment for gas fees");
        
        uint256 currentTime = block.timestamp;
        uint256 lastClick = lastClickTimestamp[msg.sender];
        
        // Check if 24 hours have passed since last click
        require(
            currentTime >= lastClick + 1 days,
            "You can only click once per 24 hours"
        );
        
        // Update last click timestamp
        lastClickTimestamp[msg.sender] = currentTime;
        
        // Calculate reward based on streak
        uint256 reward = dailyClickReward;
        
        if (lastClick > 0 && currentTime <= lastClick + 2 days) {
            // Streak continues
            clickStreak[msg.sender] += 1;
            reward = dailyClickReward + (dailyClickReward * clickStreak[msg.sender] * streakMultiplier / 100);
        } else if (lastClick > 0 && currentTime > lastClick + 2 days) {
            // Streak broken
            emit StreakBroken(msg.sender, clickStreak[msg.sender]);
            clickStreak[msg.sender] = 1;
            reward = dailyClickReward;
        } else {
            // First click
            clickStreak[msg.sender] = 1;
        }
        
        // Track totals
        totalClicks[msg.sender] += 1;
        rewardsEarned[msg.sender] += reward;
        
        // Mint NFT commemorating the click
        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadata);
        
        emit DailyClick(msg.sender, tokenId, reward, clickStreak[msg.sender], currentTime);
        
        return tokenId;
    }

    /// @notice Check if user can click today
    function canClickToday(address user) external view returns (bool) {
        uint256 currentTime = block.timestamp;
        uint256 lastClick = lastClickTimestamp[user];
        
        if (lastClick == 0) return true;
        
        return currentTime >= lastClick + 1 days;
    }

    /// @notice Get time until next click is available
    function getTimeUntilNextClick(address user) external view returns (uint256) {
        uint256 currentTime = block.timestamp;
        uint256 lastClick = lastClickTimestamp[user];
        
        if (lastClick == 0) return 0;
        
        uint256 nextClickTime = lastClick + 1 days;
        
        if (currentTime >= nextClickTime) return 0;
        
        return nextClickTime - currentTime;
    }

    /// @notice Get current streak for user
    function getStreak(address user) external view returns (uint256) {
        return clickStreak[user];
    }

    /// @notice Get total rewards earned by user
    function getTotalRewards(address user) external view returns (uint256) {
        return rewardsEarned[user];
    }

    /// @notice Owner can adjust daily reward amount
    function setDailyReward(uint256 newReward) external onlyOwner {
        dailyClickReward = newReward;
    }

    /// @notice Owner can adjust gas fee subsidy
    function setRewardAmount(uint256 newAmount) external onlyOwner {
        rewardAmount = newAmount;
    }

    /// @notice Owner can adjust streak multiplier
    function setStreakMultiplier(uint256 newMultiplier) external onlyOwner {
        streakMultiplier = newMultiplier;
    }

    /// @notice Owner can withdraw collected fees
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }

    /// @notice Claim rewards as withdrawable balance
    function claimRewards() external nonReentrant {
        uint256 rewards = rewardsEarned[msg.sender];
        require(rewards > 0, "No rewards to claim");
        
        rewardsEarned[msg.sender] = 0;
        
        emit RewardClaimed(msg.sender, rewards);
        
        // Transfer reward (in real implementation, could be token transfer)
        payable(msg.sender).transfer(rewards);
    }

    /// @notice Allow receiving ETH
    receive() external payable {}
}
