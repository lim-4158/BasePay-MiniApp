// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MysteryBoxRewards
 * @notice Rewards users with random USDC prizes when they share payments
 * @dev Uses pseudo-random number generation for prize selection
 */
contract MysteryBoxRewards is Ownable, ReentrancyGuard {
    IERC20 public immutable usdc;

    // Prize tiers in USDC (6 decimals)
    uint256[] public prizes = [
        0.01e6,  // $0.01 - 40% chance
        0.02e6,  // $0.02 - 30% chance
        0.05e6,  // $0.05 - 20% chance
        0.5e6,   // $0.50 - 8% chance
        1e6      // $1.00 - 2% chance
    ];

    // Cumulative weights for weighted random selection
    uint256[] public cumulativeWeights = [40, 70, 90, 98, 100];

    // Tracking
    mapping(address => uint256) public unclaimedBoxes;
    mapping(address => uint256) public totalClaimed;
    mapping(address => uint256) public boxesOpened;
    mapping(address => uint256) public biggestWin;

    // Stats
    uint256 public totalBoxesOpened;
    uint256 public totalRewardsDistributed;

    // Events
    event BoxGranted(address indexed user, uint256 timestamp);
    event BoxOpened(address indexed user, uint256 prize, uint256 timestamp);
    event FundsDeposited(address indexed depositor, uint256 amount);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event PrizeTiersUpdated(uint256[] newPrizes, uint256[] newWeights);

    constructor(address _usdc) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Grant a mystery box to a user (called after they share)
     * @param user Address of the user who shared
     */
    function grantMysteryBox(address user) external onlyOwner {
        require(user != address(0), "Invalid user address");
        unclaimedBoxes[user]++;
        emit BoxGranted(user, block.timestamp);
    }

    /**
     * @notice Grant mystery boxes to multiple users at once
     * @param users Array of user addresses
     */
    function grantMysteryBoxBatch(address[] calldata users) external onlyOwner {
        for (uint i = 0; i < users.length; i++) {
            if (users[i] != address(0)) {
                unclaimedBoxes[users[i]]++;
                emit BoxGranted(users[i], block.timestamp);
            }
        }
    }

    /**
     * @notice Claim and open a mystery box
     * @dev Uses pseudo-random number generation for prize selection
     */
    function claimMysteryBox() external nonReentrant {
        require(unclaimedBoxes[msg.sender] > 0, "No unclaimed boxes");

        // Decrease unclaimed boxes
        unclaimedBoxes[msg.sender]--;

        // Generate pseudo-random number
        uint256 randomValue = _generateRandomNumber(msg.sender);

        // Select prize based on weighted random
        uint256 prize = _selectPrize(randomValue);

        // Check contract has enough balance
        require(usdc.balanceOf(address(this)) >= prize, "Insufficient contract balance");

        // Transfer prize
        require(usdc.transfer(msg.sender, prize), "Transfer failed");

        // Update stats
        boxesOpened[msg.sender]++;
        totalClaimed[msg.sender] += prize;
        totalBoxesOpened++;
        totalRewardsDistributed += prize;

        if (prize > biggestWin[msg.sender]) {
            biggestWin[msg.sender] = prize;
        }

        emit BoxOpened(msg.sender, prize, block.timestamp);
    }

    /**
     * @notice Generate pseudo-random number
     * @dev Uses multiple sources of entropy for unpredictability
     * @param user User address for additional entropy
     * @return Random value between 0-99
     */
    function _generateRandomNumber(address user) private view returns (uint256) {
        uint256 randomHash = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,      // New in post-merge Ethereum (replaces difficulty)
            user,
            boxesOpened[user],
            totalBoxesOpened,
            tx.gasprice
        )));

        return randomHash % 100; // Return 0-99
    }

    /**
     * @notice Select prize based on weighted random value
     * @param randomValue Random number between 0-99
     * @return Prize amount in USDC (6 decimals)
     */
    function _selectPrize(uint256 randomValue) private view returns (uint256) {
        for (uint i = 0; i < cumulativeWeights.length; i++) {
            if (randomValue < cumulativeWeights[i]) {
                return prizes[i];
            }
        }
        // Fallback (should never reach here)
        return prizes[prizes.length - 1];
    }

    /**
     * @notice Owner deposits USDC into contract for rewards
     * @param amount Amount of USDC to deposit (6 decimals)
     */
    function depositFunds(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit FundsDeposited(msg.sender, amount);
    }

    /**
     * @notice Owner withdraws USDC from contract
     * @param amount Amount to withdraw
     */
    function withdrawFunds(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(usdc.balanceOf(address(this)) >= amount, "Insufficient balance");
        require(usdc.transfer(owner(), amount), "Transfer failed");
        emit FundsWithdrawn(owner(), amount);
    }

    /**
     * @notice Update prize tiers and weights
     * @param newPrizes New prize amounts
     * @param newCumulativeWeights New cumulative weights
     */
    function updatePrizeTiers(
        uint256[] calldata newPrizes,
        uint256[] calldata newCumulativeWeights
    ) external onlyOwner {
        require(newPrizes.length == newCumulativeWeights.length, "Length mismatch");
        require(newPrizes.length > 0, "Must have at least one prize");
        require(newCumulativeWeights[newCumulativeWeights.length - 1] == 100, "Weights must sum to 100");

        prizes = newPrizes;
        cumulativeWeights = newCumulativeWeights;

        emit PrizeTiersUpdated(newPrizes, newCumulativeWeights);
    }

    /**
     * @notice Get user's mystery box stats
     * @param user User address
     * @return unclaimed Number of unclaimed boxes
     * @return opened Total boxes opened
     * @return earned Total USDC earned
     * @return biggest Biggest single win
     */
    function getUserStats(address user) external view returns (
        uint256 unclaimed,
        uint256 opened,
        uint256 earned,
        uint256 biggest
    ) {
        return (
            unclaimedBoxes[user],
            boxesOpened[user],
            totalClaimed[user],
            biggestWin[user]
        );
    }

    /**
     * @notice Get contract balance
     * @return USDC balance of contract
     */
    function getContractBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}
