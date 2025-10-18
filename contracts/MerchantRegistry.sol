// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title MerchantRegistry
 * @dev ERC721 contract for registering merchants by their UEN (Singapore business registration number)
 * @notice Each UEN can only be claimed once, and the NFT is soulbound (non-transferable)
 */
contract MerchantRegistry is ERC721 {

    // ============ State Variables ============

    /// @notice Mapping from UEN to token ID
    mapping(string => uint256) public uenToTokenId;

    /// @notice Mapping from token ID to UEN
    mapping(uint256 => string) public tokenIdToUEN;

    /// @notice Mapping to check if UEN has been claimed
    mapping(string => bool) public isClaimed;

    /// @notice Counter for generating token IDs
    uint256 private _nextTokenId;

    // ============ Events ============

    /**
     * @notice Emitted when a merchant claims a UEN
     * @param merchant Address of the merchant who claimed
     * @param uen The UEN that was claimed
     * @param tokenId The NFT token ID assigned
     * @param timestamp Block timestamp of the claim
     */
    event MerchantClaimed(
        address indexed merchant,
        string uen,
        uint256 indexed tokenId,
        uint256 timestamp
    );

    // ============ Constructor ============

    constructor() ERC721("BasedPay Merchant", "BPAY") {}

    // ============ External Functions ============

    /**
     * @notice Claim a merchant NFT for a given UEN
     * @dev UEN must not be empty and must not have been claimed before
     * @param uen The UEN (Singapore business registration number) to claim
     * @return tokenId The token ID of the minted NFT
     */
    function claimMerchant(string memory uen) external returns (uint256) {
        require(bytes(uen).length > 0, "MerchantRegistry: Empty UEN");
        require(!isClaimed[uen], "MerchantRegistry: UEN already claimed");

        uint256 tokenId = _nextTokenId++;

        // Mint the NFT to the caller
        _safeMint(msg.sender, tokenId);

        // Store mappings
        uenToTokenId[uen] = tokenId;
        tokenIdToUEN[tokenId] = uen;
        isClaimed[uen] = true;

        emit MerchantClaimed(msg.sender, uen, tokenId, block.timestamp);

        return tokenId;
    }

    /**
     * @notice Get the merchant address (NFT owner) for a given UEN
     * @param uen The UEN to query
     * @return The address of the merchant, or address(0) if UEN is not claimed
     */
    function getMerchantAddress(string memory uen) external view returns (address) {
        if (!isClaimed[uen]) {
            return address(0);
        }
        uint256 tokenId = uenToTokenId[uen];
        return ownerOf(tokenId);
    }

    /**
     * @notice Check if a UEN has been claimed
     * @param uen The UEN to check
     * @return True if the UEN has been claimed, false otherwise
     */
    function isUENClaimed(string memory uen) external view returns (bool) {
        return isClaimed[uen];
    }

    /**
     * @notice Get the total number of merchants registered
     * @return The total number of minted NFTs
     */
    function totalMerchants() external view returns (uint256) {
        return _nextTokenId;
    }

    // ============ Internal Functions ============

    /**
     * @dev Override _update to make NFTs soulbound (non-transferable)
     * @notice Only minting (from == address(0)) and burning (to == address(0)) are allowed
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0)) and burning (to == address(0))
        // Block all transfers between addresses
        require(
            from == address(0) || to == address(0),
            "MerchantRegistry: Token is soulbound and cannot be transferred"
        );

        return super._update(to, tokenId, auth);
    }
}
