// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TriviaBattle
 * @dev Main contract for managing trivia battle matches, entry fees, and prize distribution
 */
contract TriviaBattle is ReentrancyGuard, Ownable {

    // Events
    event MatchCreated(uint256 indexed matchId, address indexed creator, uint256 entryFee, uint8 maxPlayers);
    event PlayerJoined(uint256 indexed matchId, address indexed player);
    event MatchStarted(uint256 indexed matchId, uint256[] questionIds);
    event AnswerSubmitted(uint256 indexed matchId, address indexed player, uint256 questionId, uint8 answer);
    event MatchEnded(uint256 indexed matchId, address[] winners, uint256[] prizes);
    event PrizeClaimed(uint256 indexed matchId, address indexed player, uint256 amount);

    // Match status enum
    enum MatchStatus {
        Waiting,
        Active,
        Completed,
        Cancelled
    }

    // Match structure
    struct Match {
        uint256 matchId;
        address[] players;
        uint256 entryFee;
        uint256 prizePool;
        uint256[] questionIds;
        mapping(address => uint256) scores;
        mapping(address => mapping(uint256 => uint8)) answers;
        MatchStatus status;
        uint256 startTime;
        uint256 endTime;
        uint8 maxPlayers;
        uint8 currentPlayers;
    }

    // Player statistics
    struct PlayerStats {
        address player;
        uint256 totalWins;
        uint256 totalEarnings;
        uint256 totalMatches;
    }

    // State variables
    uint256 private matchCounter;
    mapping(uint256 => Match) public matches;
    mapping(address => PlayerStats) public playerStats;
    mapping(uint256 => mapping(address => bool)) public hasClaimedPrize;
    
    uint256 public constant MIN_ENTRY_FEE = 0.1 ether; // 0.1 CELO minimum
    uint256 public constant MATCH_TIMEOUT = 1 hours;
    uint256 public platformFeePercentage = 5; // 5% platform fee

    /**
     * @dev Create a new trivia match
     * @param entryFee The entry fee in CELO tokens
     * @param maxPlayers Maximum number of players (2-4)
     */
    function createMatch(uint256 entryFee, uint8 maxPlayers) external payable nonReentrant returns (uint256) {
        require(entryFee >= MIN_ENTRY_FEE, "Entry fee too low");
        require(maxPlayers >= 2 && maxPlayers <= 4, "Invalid player count");
        require(msg.value >= entryFee, "Insufficient entry fee");

        matchCounter++;
        uint256 matchId = matchCounter;

        Match storage newMatch = matches[matchId];
        newMatch.matchId = matchId;
        newMatch.entryFee = entryFee;
        newMatch.maxPlayers = maxPlayers;
        newMatch.prizePool = entryFee;
        newMatch.status = MatchStatus.Waiting;
        newMatch.players.push(msg.sender);
        newMatch.currentPlayers = 1;

        emit MatchCreated(matchId, msg.sender, entryFee, maxPlayers);

        return matchId;
    }

    /**
     * @dev Join an existing match
     * @param matchId The ID of the match to join
     */
    function joinMatch(uint256 matchId) external payable nonReentrant {
        Match storage match_ = matches[matchId];
        require(match_.status == MatchStatus.Waiting, "Match not available");
        require(match_.currentPlayers < match_.maxPlayers, "Match is full");
        require(msg.value >= match_.entryFee, "Insufficient entry fee");
        require(!isPlayerInMatch(matchId, msg.sender), "Already in match");

        match_.players.push(msg.sender);
        match_.currentPlayers++;
        match_.prizePool += match_.entryFee;

        emit PlayerJoined(matchId, msg.sender);
    }

    /**
     * @dev Start a match (called by backend or when match is full)
     * @param matchId The ID of the match to start
     * @param questionIds Array of question IDs for this match
     */
    function startMatch(uint256 matchId, uint256[] memory questionIds) external onlyOwner {
        Match storage match_ = matches[matchId];
        require(match_.status == MatchStatus.Waiting, "Match not in waiting state");
        require(match_.currentPlayers == match_.maxPlayers, "Match not full");
        require(questionIds.length > 0, "No questions provided");

        match_.status = MatchStatus.Active;
        match_.startTime = block.timestamp;
        match_.questionIds = questionIds;

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
    ) external {
        Match storage match_ = matches[matchId];
        require(match_.status == MatchStatus.Active, "Match not active");
        require(isPlayerInMatch(matchId, msg.sender), "Not a player in this match");
        require(match_.answers[msg.sender][questionId] == 0, "Answer already submitted");
        require(answer < 4, "Invalid answer");

        match_.answers[msg.sender][questionId] = answer;

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
    ) external onlyOwner {
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

        emit MatchEnded(matchId, winners, prizes);
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

        // Transfer prize
        (bool success, ) = msg.sender.call{value: playerPrize}("");
        require(success, "Transfer failed");

        emit PrizeClaimed(matchId, msg.sender, playerPrize);
    }

    /**
     * @dev Get match details
     */
    function getMatchDetails(uint256 matchId) external view returns (
        uint256 matchId_,
        address[] memory players,
        uint256 entryFee,
        uint256 prizePool,
        MatchStatus status,
        uint256 startTime,
        uint8 currentPlayers,
        uint8 maxPlayers
    ) {
        Match storage match_ = matches[matchId];
        return (
            match_.matchId,
            match_.players,
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
    function getPlayerScore(uint256 matchId, address player) external view returns (uint256) {
        return matches[matchId].scores[player];
    }

    // Internal helper functions
    function isPlayerInMatch(uint256 matchId, address player) internal view returns (bool) {
        Match storage match_ = matches[matchId];
        for (uint256 i = 0; i < match_.players.length; i++) {
            if (match_.players[i] == player) {
                return true;
            }
        }
        return false;
    }

    function getWinners(uint256 matchId) internal view returns (address[] memory) {
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

    function isWinner(uint256 matchId, address player, address[] memory winners) internal pure returns (bool) {
        for (uint256 i = 0; i < winners.length; i++) {
            if (winners[i] == player) {
                return true;
            }
        }
        return false;
    }

    function calculatePrizes(uint256 matchId, address[] memory winners) internal view returns (uint256[] memory) {
        Match storage match_ = matches[matchId];
        uint256[] memory prizes = new uint256[](winners.length);
        uint256 prizePerWinner = match_.prizePool / winners.length;
        
        for (uint256 i = 0; i < winners.length; i++) {
            prizes[i] = prizePerWinner;
        }
        
        return prizes;
    }

    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Set platform fee percentage (owner only)
     */
    function setPlatformFee(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 10, "Fee too high");
        platformFeePercentage = _feePercentage;
    }
}

