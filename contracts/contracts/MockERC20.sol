// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MockERC20
 * @dev Production-grade test ERC20 token with real functionality
 * Used for testing Trivia Battle DApp on Celo Sepolia
 * 
 * Features:
 * - Full ERC20 implementation with burnable and pausable extensions
 * - Role-based access control (MINTER_ROLE, PAUSER_ROLE)
 * - Faucet for test token distribution
 * - Event logging for all operations
 * - Transparent balance management
 * - Real transaction simulation
 */
contract MockERC20 is ERC20, ERC20Burnable, ERC20Pausable, Ownable, AccessControl {
    // Role definitions for access control
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant FAUCET_ROLE = keccak256("FAUCET_ROLE");

    // Token configuration
    uint8 private _decimals;
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18; // 1 billion tokens
    uint256 public constant FAUCET_AMOUNT = 1000 * 10 ** 18; // 1000 tokens per faucet call
    uint256 public constant FAUCET_COOLDOWN = 1 days; // Cooldown between faucet calls

    // Faucet tracking
    mapping(address => uint256) public lastFaucetTime;

    // Events
    event TokensMinted(address indexed to, uint256 amount, address indexed minter);
    event TokensBurned(address indexed from, uint256 amount);
    event FaucetUsed(address indexed user, uint256 amount, uint256 timestamp);
    event PauseToggled(bool paused, address indexed by);
    event DecimalsSet(uint8 decimals);

    /**
     * @dev Initialize MockERC20 token with name and symbol
     * @param name Token name
     * @param symbol Token symbol
     */
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = 18;
        
        // Setup role-based access
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(FAUCET_ROLE, msg.sender);

        // Mint initial supply to owner for distribution
        _mint(msg.sender, 1_000_000 * 10 ** 18); // 1 million tokens
        
        emit TokensMinted(msg.sender, 1_000_000 * 10 ** 18, msg.sender);
    }

    /**
     * @dev Mint tokens to an address (requires MINTER_ROLE)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds maximum supply");

        _mint(to, amount);
        emit TokensMinted(to, amount, msg.sender);
    }

    /**
     * @dev Burn tokens from caller's account
     * @param amount Amount to burn
     */
    function burn(uint256 amount) public override {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev Burn tokens from specific address (requires MINTER_ROLE)
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burnFrom(address from, uint256 amount) public override onlyRole(MINTER_ROLE) {
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(from) >= amount, "Insufficient balance");
        
        super.burnFrom(from, amount);
        emit TokensBurned(from, amount);
    }

    /**
     * @dev Faucet function - anyone can claim test tokens (with cooldown)
     * @param amount Amount to claim
     */
    function faucet(uint256 amount) external whenNotPaused onlyRole(FAUCET_ROLE) {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= FAUCET_AMOUNT, "Exceeds faucet limit");
        require(
            block.timestamp >= lastFaucetTime[msg.sender] + FAUCET_COOLDOWN,
            "Faucet cooldown not met"
        );
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds maximum supply");

        lastFaucetTime[msg.sender] = block.timestamp;
        _mint(msg.sender, amount);
        
        emit FaucetUsed(msg.sender, amount, block.timestamp);
        emit TokensMinted(msg.sender, amount, address(this));
    }

    /**
     * @dev Public faucet - anyone can claim test tokens (with cooldown)
     */
    function publicFaucet() external whenNotPaused {
        uint256 amount = FAUCET_AMOUNT;
        require(
            block.timestamp >= lastFaucetTime[msg.sender] + FAUCET_COOLDOWN,
            "Faucet cooldown not met"
        );
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds maximum supply");

        lastFaucetTime[msg.sender] = block.timestamp;
        _mint(msg.sender, amount);
        
        emit FaucetUsed(msg.sender, amount, block.timestamp);
        emit TokensMinted(msg.sender, amount, address(this));
    }

    /**
     * @dev Get time remaining until next faucet claim
     * @param user User address
     * @return Time remaining in seconds (0 if ready)
     */
    function faucetCooldownRemaining(address user) external view returns (uint256) {
        uint256 nextAvailable = lastFaucetTime[user] + FAUCET_COOLDOWN;
        if (block.timestamp >= nextAvailable) {
            return 0;
        }
        return nextAvailable - block.timestamp;
    }

    /**
     * @dev Pause token transfers (requires PAUSER_ROLE)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
        emit PauseToggled(true, msg.sender);
    }

    /**
     * @dev Unpause token transfers (requires PAUSER_ROLE)
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
        emit PauseToggled(false, msg.sender);
    }

    /**
     * @dev Set custom decimals (requires owner)
     * @param decimals_ Number of decimals
     */
    function setDecimals(uint8 decimals_) external onlyOwner {
        require(decimals_ <= 18, "Decimals cannot exceed 18");
        _decimals = decimals_;
        emit DecimalsSet(decimals_);
    }

    /**
     * @dev Returns the number of decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Grant minter role to address (admin only)
     * @param to Address to grant role
     */
    function grantMinterRole(address to) external onlyOwner {
        grantRole(MINTER_ROLE, to);
    }

    /**
     * @dev Grant pauser role to address (admin only)
     * @param to Address to grant role
     */
    function grantPauserRole(address to) external onlyOwner {
        grantRole(PAUSER_ROLE, to);
    }

    /**
     * @dev Grant faucet role to address (admin only)
     * @param to Address to grant role
     */
    function grantFaucetRole(address to) external onlyOwner {
        grantRole(FAUCET_ROLE, to);
    }

    /**
     * @dev Check if address has specific role
     * @param role Role to check
     * @param account Address to check
     */
    function hasRole(bytes32 role, address account) 
        public 
        view 
        override(AccessControl) 
        returns (bool) 
    {
        return super.hasRole(role, account);
    }

    /**
     * @dev Check token balance
     * @param account Address to check
     */
    function balanceOf(address account) 
        public 
        view 
        override(ERC20) 
        returns (uint256) 
    {
        return super.balanceOf(account);
    }

    /**
     * @dev Check allowance
     * @param owner Owner address
     * @param spender Spender address
     */
    function allowance(address owner, address spender) 
        public 
        view 
        override(ERC20) 
        returns (uint256) 
    {
        return super.allowance(owner, spender);
    }

    /**
     * @dev Approve tokens for spending
     * @param spender Spender address
     * @param amount Amount to approve
     */
    function approve(address spender, uint256 amount) 
        public 
        override(ERC20) 
        returns (bool) 
    {
        return super.approve(spender, amount);
    }

    /**
     * @dev Transfer tokens
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transfer(address to, uint256 amount) 
        public 
        override(ERC20) 
        whenNotPaused 
        returns (bool) 
    {
        return super.transfer(to, amount);
    }

    /**
     * @dev Transfer tokens from sender to recipient
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override(ERC20) 
        whenNotPaused 
        returns (bool) 
    {
        return super.transferFrom(from, to, amount);
    }

    /**
     * @dev Increase allowance for spending
     * @param spender Spender address
     * @param addedValue Amount to increase
     */
    function increaseAllowance(address spender, uint256 addedValue) 
        public 
        override(ERC20) 
        whenNotPaused 
        returns (bool) 
    {
        return super.increaseAllowance(spender, addedValue);
    }

    /**
     * @dev Decrease allowance for spending
     * @param spender Spender address
     * @param subtractedValue Amount to decrease
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) 
        public 
        override(ERC20) 
        whenNotPaused 
        returns (bool) 
    {
        return super.decreaseAllowance(spender, subtractedValue);
    }

    /**
     * @dev Internal function to handle token transfers during pause
     */
    function _update(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, amount);
    }

    /**
     * @dev Internal function to handle token nonces
     */
    function nonces(address owner)
        public
        view
        override(ERC20)
        returns (uint256)
    {
        return super.nonces(owner);
    }

    /**
     * @dev Get token information
     */
    function tokenInfo() external view returns (
        string memory name,
        string memory symbol,
        uint8 decimalsValue,
        uint256 totalSupplyValue,
        uint256 maxSupply,
        bool paused
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            MAX_SUPPLY,
            paused()
        );
    }
}
