// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MerchantRegistry
 * @dev Minimal registry that maps a PayNow QR payload to the merchant wallet that owns it.
 */
contract MerchantRegistry {
    // ============ State Variables ============

    /// @notice Mapping from raw QR payload to the wallet that registered it
    mapping(string => address) private _qrToMerchant;

    /// @notice Total number of unique QR payloads registered
    uint256 private _totalRegistrations;

    // ============ Events ============

    /**
     * @notice Emitted when a merchant registers a QR payload
     * @param merchant Address of the merchant who registered
     * @param qrPayload Full QR payload string that was registered
     * @param timestamp Block timestamp of the registration
     */
    event MerchantRegistered(
        address indexed merchant,
        string qrPayload,
        uint256 timestamp
    );

    // ============ External Functions ============

    /**
     * @notice Register a merchant for a given QR payload
     * @dev Payload must not be empty and must not have been registered before
     * @param qrPayload The full QR payload string to register
     */
    function registerMerchant(string calldata qrPayload) external {
        require(bytes(qrPayload).length > 0, "MerchantRegistry: Empty QR payload");
        require(
            _qrToMerchant[qrPayload] == address(0),
            "MerchantRegistry: QR already registered"
        );

        _qrToMerchant[qrPayload] = msg.sender;
        unchecked {
            _totalRegistrations += 1;
        }

        emit MerchantRegistered(msg.sender, qrPayload, block.timestamp);
    }

    /**
     * @notice Get the merchant wallet that registered a given QR payload
     * @param qrPayload The QR payload to query
     * @return The merchant wallet address, or address(0) if the payload is unregistered
     */
    function merchantForQr(string calldata qrPayload) external view returns (address) {
        return _qrToMerchant[qrPayload];
    }

    /**
     * @notice Check whether a QR payload has already been registered
     * @param qrPayload The QR payload to check
     * @return True if registered, false otherwise
     */
    function isQrRegistered(string calldata qrPayload) external view returns (bool) {
        return _qrToMerchant[qrPayload] != address(0);
    }

    /**
     * @notice Get the total number of unique QR payloads registered
     */
    function totalMerchants() external view returns (uint256) {
        return _totalRegistrations;
    }
}
