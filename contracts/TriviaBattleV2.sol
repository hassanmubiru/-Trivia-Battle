// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title TriviaBattleV2
 * @dev Enhanced contract with multi-stablecoin support, escrow mechanism, and improved security
 */
contract TriviaBattleV2 is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // Supported stablecoin addresses (configured per network)
    // Mainnet addresses:
    // CUSD: 0x765DE816845861e75A25fCA122bb6898B8B1282a
    // USDC: 0xceBA9300f2b948710d2653dD7B07f33A8b32118C
    // USDT: 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e
    // For testnets, use addSupportedToken() after deployment to configure tokens

    // Events
    event MatchCreated(
        uint256 indexed matchId,
        address indexed creator,
        address token,
        uint256 entryFee,
        uint8 maxPlayers
    );
    event PlayerJoined(uint256 indexed matchId, address indexed player, address token, uint256 amount);
    event MatchStarted(uint256 indexed matchId, uint256[] questionIds);
    event AnswerSubmitted(
        uint256 indexed matchId,
        address indexed player,
        uint256 questionId,
        uint8 answer
    );
    event MatchEnded(uint256 indexed matchId, address[] winners, uint256[] prizes, address token);
    event PrizeClaimed(uint256 indexed matchId, address indexed player, uint256 amount, address token);
    event EscrowDeposited(uint256 indexed matchId, address token, uint256 amount);
    event EscrowReleased(uint256 indexed matchId, address token, uint256 amount);
    event RefundIssued(uint256 indexed matchId, address indexed player, uint256 amount, address token);

    // Match status enum
    enum MatchStatus {
        Waiting,
        Active,
        Completed,
        Cancelled,
        Refunded
    }

    // Match structure with escrow support
    struct Match {
        uint256 matchId;
        address[] players;
        address token; // Stablecoin token address (cUSD, USDC, USDT)
        uint256 entryFee;
        uint256 prizePool;
        uint256 escrowAmount; // Total amount in escrow
        uint256[] questionIds;
        mapping(address => uint256) scores;
        mapping(address => mapping(uint256 => uint8)) answers;
        mapping(address => bool) hasAnswered;
        MatchStatus status;
        uint256 startTime;
        uint256 endTime;
        uint256 timeout;
        uint8 maxPlayers;
        uint8 currentPlayers;
        bool escrowLocked;
    }

    // Player statistics
    struct PlayerStats {
        address player;
        uint256 totalWins;
        uint256 totalEarnings;
        uint256 totalMatches;
        uint256 totalEarningsCUSD;
        uint256 totalEarningsUSDC;
        uint256 totalEarningsUSDT;
    }

    // State variables
    uint256 private matchCounter;
    mapping(uint256 => Match) public matches;
    mapping(address => PlayerStats) public playerStats;
    mapping(uint256 => mapping(address => bool)) public hasClaimedPrize;
    mapping(address => bool) public supportedTokens;
    
    uint256 public constant MIN_ENTRY_FEE = 0.1 ether; // Minimum in token units (scaled)
    uint256 public constant MATCH_TIMEOUT = 1 hours;
    uint256 public constant ANSWER_TIMEOUT = 30 seconds; // Time per question
    uint256 public platformFeePercentage = 5; // 5% platform fee
    uint256 public maxMatchesPerPlayer = 10; // Prevent spam

    // Escrow tracking
    mapping(uint256 => mapping(address => uint256)) public escrowBalances; // matchId => token => amount

    constructor() {
        // Token addresses are network-specific
        // Use addSupportedToken() after deployment to configure tokens for your network
        // For Celo Sepolia testnet, deploy mock tokens or configure available testnet tokens
    }

    /**
     * @dev Create a new trivia match with specified stablecoin
     * @param tokenAddress The stablecoin token address (cUSD, USDC, or USDT)
     * @param entryFee The entry fee in token units (with decimals)
     * @param maxPlayers Maximum number of players (2-4)
     */
    function createMatch(
        address tokenAddress,
        uint256 entryFee,
        uint8 maxPlayers
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(supportedTokens[tokenAddress], "Unsupported token");
        require(entryFee >= MIN_ENTRY_FEE, "Entry fee too low");
        require(maxPlayers >= 2 && maxPlayers <= 4, "Invalid player count");
        require(
            playerStats[msg.sender].totalMatches < maxMatchesPerPlayer,
            "Match limit reached"
        );

        IERC20 token = IERC20(tokenAddress);
        require(token.balanceOf(msg.sender) >= entryFee, "Insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= entryFee, "Insufficient allowance");

        matchCounter++;
        uint256 matchId = matchCounter;

        Match storage newMatch = matches[matchId];
        newMatch.matchId = matchId;
        newMatch.token = tokenAddress;
        newMatch.entryFee = entryFee;
        newMatch.maxPlayers = maxPlayers;
        newMatch.prizePool = entryFee;
        newMatch.escrowAmount = entryFee;
        newMatch.status = MatchStatus.Waiting;
        newMatch.players.push(msg.sender);
        newMatch.currentPlayers = 1;
        newMatch.timeout = block.timestamp + MATCH_TIMEOUT;

        // Transfer tokens to escrow
        token.safeTransferFrom(msg.sender, address(this), entryFee);
        escrowBalances[matchId][tokenAddress] = entryFee;

        emit EscrowDeposited(matchId, tokenAddress, entryFee);
        emit MatchCreated(matchId, msg.sender, tokenAddress, entryFee, maxPlayers);

        return matchId;
    }

    /**
     * @dev Join an existing match
     * @param matchId The ID of the match to join
     */
    function joinMatch(uint256 matchId) external whenNotPaused nonReentrant {
        Match storage match_ = matches[matchId];
        require(match_.status == MatchStatus.Waiting, "Match not available");
        require(match_.currentPlayers < match_.maxPlayers, "Match is full");
        require(block.timestamp < match_.timeout, "Match expired");
        require(!isPlayerInMatch(matchId, msg.sender), "Already in match");

        IERC20 token = IERC20(match_.token);
        require(token.balanceOf(msg.sender) >= match_.entryFee, "Insufficient token balance");
        require(
            token.allowance(msg.sender, address(this)) >= match_.entryFee,
            "Insufficient allowance"
        );

        match_.players.push(msg.sender);
        match_.currentPlayers++;
        match_.prizePool += match_.entryFee;
        match_.escrowAmount += match_.entryFee;

        // Transfer tokens to escrow
        token.safeTransferFrom(msg.sender, address(this), match_.entryFee);
        escrowBalances[matchId][match_.token] += match_.entryFee;

        emit EscrowDeposited(matchId, match_.token, match_.entryFee);
        emit PlayerJoined(matchId, msg.sender, match_.token, match_.entryFee);
    }

    /**
     * @dev Start a match (called by backend or when match is full)
     * @param matchId The ID of the match to start
     * @param questionIds Array of question IDs for this match
     */
    function startMatch(
        uint256 matchId,
        uint256[] memory questionIds
    ) external onlyOwner whenNotPaused {
        Match storage match_ = matches[matchId];
        require(match_.status == MatchStatus.Waiting, "Match not in waiting state");
        require(match_.currentPlayers == match_.maxPlayers, "Match not full");
        require(questionIds.length > 0, "No questions provided");
        require(!match_.escrowLocked, "Escrow already locked");

        match_.status = MatchStatus.Active;
        match_.startTime = block.timestamp;
        match_.endTime = block.timestamp + (questionIds.length * ANSWER_TIMEOUT);
        match_.questionIds = questionIds;
        match_.escrowLocked = true; // Lock escrow during active match

        emit MatchStarted(matchId, questionIds);
    }

    /**
     * @dev Submit an answer for a question
     * @param matchId The ID of the match
     * @param questionId The ID of the question
     * @param answer The selected answer (0-3 for multiple choice)
     */
    function submitAnswer(
        uint256 matchId,
        uint256 questionId,
        uint8 answer
    ) external whenNotPaused {
        Match storage match_ = matches[matchId];
        require(match_.status == MatchStatus.Active, "Match not active");
        require(isPlayerInMatch(matchId, msg.sender), "Not a player in this match");
        require(block.timestamp <= match_.endTime, "Match time expired");
        require(match_.answers[msg.sender][questionId] == 0, "Answer already submitted");
        require(answer < 4, "Invalid answer");

        match_.answers[msg.sender][questionId] = answer;
        match_.hasAnswered[msg.sender] = true;

        emit AnswerSubmitted(matchId, msg.sender, questionId, answer);
    }

    /**
     * @dev End a match and calculate winners
     * @param matchId The ID of the match
     * @param questionIds Array of question IDs in order
     * @param correctAnswers Array of correct answers (same order as questionIds)
     */
    function endMatch(
        uint256 matchId,
        uint256[] memory questionIds,
        uint8[] memory correctAnswers
    ) external onlyOwner whenNotPaused {
        Match storage match_ = matches[matchId];
        require(match_.status == MatchStatus.Active, "Match not active");
        require(questionIds.length == correctAnswers.length, "Arrays length mismatch");
        require(questionIds.length == match_.questionIds.length, "Question count mismatch");

        // Calculate scores
        for (uint256 i = 0; i < match_.players.length; i++) {
            address player = match_.players[i];
            uint256 score = 0;

            for (uint256 j = 0; j < questionIds.length; j++) {
                uint256 qId = questionIds[j];
                if (match_.answers[player][qId] == correctAnswers[j]) {
                    score++;
                }
            }

            match_.scores[player] = score;
        }

        match_.status = MatchStatus.Completed;
        match_.endTime = block.timestamp;

        // Determine winners (simplified: highest score wins)
        address[] memory winners = getWinners(matchId);
        uint256[] memory prizes = calculatePrizes(matchId, winners);

        emit MatchEnded(matchId, winners, prizes, match_.token);
    }

    /**
     * @dev Claim prize after match completion
     * @param matchId The ID of the match
     */
    function claimPrize(uint256 matchId) external nonReentrant {
        Match storage match_ = matches[matchId];
        require(match_.status == MatchStatus.Completed, "Match not completed");
        require(isPlayerInMatch(matchId, msg.sender), "Not a player");
        require(!hasClaimedPrize[matchId][msg.sender], "Prize already claimed");

        // Calculate prize (simplified winner-takes-all)
        address[] memory winners = getWinners(matchId);
        require(isWinner(matchId, msg.sender, winners), "Not a winner");

        uint256 prize = match_.prizePool;
        uint256 platformFee = (prize * platformFeePercentage) / 100;
        uint256 playerPrize = prize - platformFee;

        hasClaimedPrize[matchId][msg.sender] = true;

        // Update player stats
        playerStats[msg.sender].totalWins++;
        playerStats[msg.sender].totalEarnings += playerPrize;
        playerStats[msg.sender].totalMatches++;

        // Update token-specific earnings
        if (match_.token == CUSD) {
            playerStats[msg.sender].totalEarningsCUSD += playerPrize;
        } else if (match_.token == USDC) {
            playerStats[msg.sender].totalEarningsUSDC += playerPrize;
        } else if (match_.token == USDT) {
            playerStats[msg.sender].totalEarningsUSDT += playerPrize;
        }

        // Release from escrow and transfer prize
        require(escrowBalances[matchId][match_.token] >= playerPrize, "Insufficient escrow");
        escrowBalances[matchId][match_.token] -= playerPrize;

        IERC20 token = IERC20(match_.token);
        token.safeTransfer(msg.sender, playerPrize);

        emit EscrowReleased(matchId, match_.token, playerPrize);
        emit PrizeClaimed(matchId, msg.sender, playerPrize, match_.token);
    }

    /**
     * @dev Refund entry fee if match is cancelled or expired
     * @param matchId The ID of the match
     */
    function refundEntryFee(uint256 matchId) external nonReentrant {
        Match storage match_ = matches[matchId];
        require(
            match_.status == MatchStatus.Cancelled || 
            (match_.status == MatchStatus.Waiting && block.timestamp > match_.timeout),
            "Match not refundable"
        );
        require(isPlayerInMatch(matchId, msg.sender), "Not a player");
        require(!hasClaimedPrize[matchId][msg.sender], "Already processed");

        uint256 refundAmount = match_.entryFee;
        hasClaimedPrize[matchId][msg.sender] = true;

        // Release from escrow
        require(escrowBalances[matchId][match_.token] >= refundAmount, "Insufficient escrow");
        escrowBalances[matchId][match_.token] -= refundAmount;

        IERC20 token = IERC20(match_.token);
        token.safeTransfer(msg.sender, refundAmount);

        emit EscrowReleased(matchId, match_.token, refundAmount);
        emit RefundIssued(matchId, msg.sender, refundAmount, match_.token);
    }

    /**
     * @dev Cancel a match (owner only, for emergencies)
     * @param matchId The ID of the match to cancel
     */
    function cancelMatch(uint256 matchId) external onlyOwner {
        Match storage match_ = matches[matchId];
        require(
            match_.status == MatchStatus.Waiting || match_.status == MatchStatus.Active,
            "Match cannot be cancelled"
        );
        match_.status = MatchStatus.Cancelled;
    }

    /**
     * @dev Get match details
     */
    function getMatchDetails(
        uint256 matchId
    )
        external
        view
        returns (
            uint256 matchId_,
            address[] memory players,
            address token,
            uint256 entryFee,
            uint256 prizePool,
            MatchStatus status,
            uint256 startTime,
            uint8 currentPlayers,
            uint8 maxPlayers
        )
    {
        Match storage match_ = matches[matchId];
        return (
            match_.matchId,
            match_.players,
            match_.token,
            match_.entryFee,
            match_.prizePool,
            match_.status,
            match_.startTime,
            match_.currentPlayers,
            match_.maxPlayers
        );
    }

    /**
     * @dev Get player score in a match
     */
    function getPlayerScore(
        uint256 matchId,
        address player
    ) external view returns (uint256) {
        return matches[matchId].scores[player];
    }

    /**
     * @dev Get escrow balance for a match
     */
    function getEscrowBalance(
        uint256 matchId,
        address token
    ) external view returns (uint256) {
        return escrowBalances[matchId][token];
    }

    // Internal helper functions
    function isPlayerInMatch(
        uint256 matchId,
        address player
    ) internal view returns (bool) {
        Match storage match_ = matches[matchId];
        for (uint256 i = 0; i < match_.players.length; i++) {
            if (match_.players[i] == player) {
                return true;
            }
        }
        return false;
    }

    function getWinners(
        uint256 matchId
    ) internal view returns (address[] memory) {
        Match storage match_ = matches[matchId];
        uint256 maxScore = 0;

        // Find max score
        for (uint256 i = 0; i < match_.players.length; i++) {
            if (match_.scores[match_.players[i]] > maxScore) {
                maxScore = match_.scores[match_.players[i]];
            }
        }

        // Count winners
        uint256 winnerCount = 0;
        for (uint256 i = 0; i < match_.players.length; i++) {
            if (match_.scores[match_.players[i]] == maxScore) {
                winnerCount++;
            }
        }

        // Build winners array
        address[] memory winners = new address[](winnerCount);
        uint256 index = 0;
        for (uint256 i = 0; i < match_.players.length; i++) {
            if (match_.scores[match_.players[i]] == maxScore) {
                winners[index] = match_.players[i];
                index++;
            }
        }

        return winners;
    }

    function isWinner(
        uint256 matchId,
        address player,
        address[] memory winners
    ) internal pure returns (bool) {
        for (uint256 i = 0; i < winners.length; i++) {
            if (winners[i] == player) {
                return true;
            }
        }
        return false;
    }

    function calculatePrizes(
        uint256 matchId,
        address[] memory winners
    ) internal view returns (uint256[] memory) {
        Match storage match_ = matches[matchId];
        uint256[] memory prizes = new uint256[](winners.length);
        uint256 prizePerWinner = match_.prizePool / winners.length;

        for (uint256 i = 0; i < winners.length; i++) {
            prizes[i] = prizePerWinner;
        }

        return prizes;
    }

    // Admin functions
    function setPlatformFee(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 10, "Fee too high");
        platformFeePercentage = _feePercentage;
    }

    function addSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = true;
    }

    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
    }

    function setMaxMatchesPerPlayer(uint256 _max) external onlyOwner {
        maxMatchesPerPlayer = _max;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal (owner only, for stuck funds)
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}

