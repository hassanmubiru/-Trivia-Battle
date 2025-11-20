// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title TriviaBattleV3
 * @dev Fully on-chain trivia game - no database required
 * All questions, matches, and game logic stored on blockchain
 */
contract TriviaBattleV3 is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    struct Question {
        uint256 id;
        string questionText;
        string[4] options;
        uint8 correctAnswer; // 0-3
        string category;
        uint8 difficulty; // 1-5
        bool isActive;
    }

    struct Match {
        uint256 matchId;
        address[] players;
        address token;
        uint256 entryFee;
        uint256 prizePool;
        uint256 escrowAmount;
        uint256[] questionIds;
        mapping(address => uint256) scores;
        mapping(address => mapping(uint256 => uint8)) answers;
        mapping(address => bool) hasClaimedPrize;
        MatchStatus status;
        uint256 startTime;
        uint256 endTime;
        uint256 createdAt;
        uint8 maxPlayers;
        uint8 currentPlayers;
        uint8 questionsPerMatch;
        bool autoStart; // Auto-start when full
    }

    struct PlayerStats {
        uint256 totalWins;
        uint256 totalEarnings;
        uint256 totalMatches;
        uint256 totalCorrectAnswers;
        uint256 highestScore;
        uint256 lastPlayedAt;
    }

    // ============ Enums ============

    enum MatchStatus {
        Waiting,
        Active,
        Completed,
        Cancelled
    }

    // ============ State Variables ============

    // Questions
    uint256 private questionCounter;
    mapping(uint256 => Question) public questions;
    uint256[] public activeQuestionIds;
    mapping(string => uint256[]) public questionsByCategory;

    // Matches
    uint256 private matchCounter;
    mapping(uint256 => Match) public matches;
    uint256[] public activeMatchIds;
    uint256[] public completedMatchIds;

    // Players
    mapping(address => PlayerStats) public playerStats;
    mapping(address => uint256[]) public playerMatches;
    mapping(uint256 => mapping(address => bool)) public hasClaimedPrize;

    // Tokens
    mapping(address => bool) public supportedTokens;
    mapping(uint256 => mapping(address => uint256)) public escrowBalances;

    // Configuration
    uint256 public constant MIN_ENTRY_FEE = 0.1 ether;
    uint256 public constant MATCH_TIMEOUT = 1 hours;
    uint256 public constant ANSWER_TIMEOUT = 30 seconds;
    uint256 public platformFeePercentage = 5;
    uint256 public maxMatchesPerPlayer = 10;
    uint8 public constant MIN_QUESTIONS = 5;
    uint8 public constant MAX_QUESTIONS = 20;

    // ============ Events ============

    event QuestionAdded(uint256 indexed questionId, string category, uint8 difficulty);
    event QuestionUpdated(uint256 indexed questionId);
    event QuestionDeactivated(uint256 indexed questionId);
    
    event MatchCreated(
        uint256 indexed matchId,
        address indexed creator,
        address token,
        uint256 entryFee,
        uint8 maxPlayers,
        uint8 questionsPerMatch
    );
    event PlayerJoined(uint256 indexed matchId, address indexed player);
    event MatchStarted(uint256 indexed matchId, uint256[] questionIds);
    event AnswerSubmitted(
        uint256 indexed matchId,
        address indexed player,
        uint256 questionId,
        uint8 answer,
        bool isCorrect
    );
    event MatchEnded(
        uint256 indexed matchId,
        address[] winners,
        uint256[] scores,
        uint256 prizePerWinner
    );
    event PrizeClaimed(
        uint256 indexed matchId,
        address indexed player,
        uint256 amount
    );
    event RefundIssued(uint256 indexed matchId, address indexed player, uint256 amount);

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {}

    // ============ Question Management ============

    /**
     * @dev Add a new question to the contract
     */
    function addQuestion(
        string memory _questionText,
        string[4] memory _options,
        uint8 _correctAnswer,
        string memory _category,
        uint8 _difficulty
    ) external onlyOwner returns (uint256) {
        require(_correctAnswer < 4, "Invalid correct answer");
        require(_difficulty >= 1 && _difficulty <= 5, "Difficulty must be 1-5");
        require(bytes(_questionText).length > 0, "Question text required");

        questionCounter++;
        uint256 questionId = questionCounter;

        Question storage newQuestion = questions[questionId];
        newQuestion.id = questionId;
        newQuestion.questionText = _questionText;
        newQuestion.options = _options;
        newQuestion.correctAnswer = _correctAnswer;
        newQuestion.category = _category;
        newQuestion.difficulty = _difficulty;
        newQuestion.isActive = true;

        activeQuestionIds.push(questionId);
        questionsByCategory[_category].push(questionId);

        emit QuestionAdded(questionId, _category, _difficulty);
        return questionId;
    }

    /**
     * @dev Add multiple questions in batch
     */
    function addQuestionsBatch(
        string[] memory _questionTexts,
        string[4][] memory _optionsList,
        uint8[] memory _correctAnswers,
        string[] memory _categories,
        uint8[] memory _difficulties
    ) external onlyOwner returns (uint256[] memory) {
        require(
            _questionTexts.length == _optionsList.length &&
            _questionTexts.length == _correctAnswers.length &&
            _questionTexts.length == _categories.length &&
            _questionTexts.length == _difficulties.length,
            "Array length mismatch"
        );

        uint256[] memory questionIds = new uint256[](_questionTexts.length);

        for (uint256 i = 0; i < _questionTexts.length; i++) {
            questionCounter++;
            uint256 questionId = questionCounter;

            Question storage newQuestion = questions[questionId];
            newQuestion.id = questionId;
            newQuestion.questionText = _questionTexts[i];
            newQuestion.options = _optionsList[i];
            newQuestion.correctAnswer = _correctAnswers[i];
            newQuestion.category = _categories[i];
            newQuestion.difficulty = _difficulties[i];
            newQuestion.isActive = true;

            activeQuestionIds.push(questionId);
            questionsByCategory[_categories[i]].push(questionId);

            questionIds[i] = questionId;
            emit QuestionAdded(questionId, _categories[i], _difficulties[i]);
        }

        return questionIds;
    }

    /**
     * @dev Deactivate a question (doesn't delete, just marks inactive)
     */
    function deactivateQuestion(uint256 _questionId) external onlyOwner {
        require(questions[_questionId].isActive, "Question already inactive");
        questions[_questionId].isActive = false;
        emit QuestionDeactivated(_questionId);
    }

    /**
     * @dev Get random question IDs for a match
     */
    function getRandomQuestions(
        uint8 count,
        uint256 seed
    ) public view returns (uint256[] memory) {
        require(count >= MIN_QUESTIONS && count <= MAX_QUESTIONS, "Invalid question count");
        require(activeQuestionIds.length >= count, "Not enough questions");

        uint256[] memory selectedIds = new uint256[](count);
        uint256[] memory availableIds = new uint256[](activeQuestionIds.length);
        uint256 availableCount = 0;

        // Build list of active questions
        for (uint256 i = 0; i < activeQuestionIds.length; i++) {
            uint256 qId = activeQuestionIds[i];
            if (questions[qId].isActive) {
                availableIds[availableCount] = qId;
                availableCount++;
            }
        }

        require(availableCount >= count, "Not enough active questions");

        // Simple pseudo-random selection (not cryptographically secure, but sufficient for game)
        for (uint8 i = 0; i < count; i++) {
            uint256 randomIndex = uint256(
                keccak256(abi.encodePacked(seed, block.timestamp, block.prevrandao, i))
            ) % availableCount;
            
            selectedIds[i] = availableIds[randomIndex];
            
            // Remove selected question from available pool
            availableIds[randomIndex] = availableIds[availableCount - 1];
            availableCount--;
        }

        return selectedIds;
    }

    /**
     * @dev Get question details
     */
    function getQuestion(uint256 _questionId) external view returns (
        uint256 id,
        string memory questionText,
        string[4] memory options,
        string memory category,
        uint8 difficulty,
        bool isActive
    ) {
        Question storage q = questions[_questionId];
        return (
            q.id,
            q.questionText,
            q.options,
            q.category,
            q.difficulty,
            q.isActive
        );
    }

    /**
     * @dev Get total number of questions
     */
    function getTotalQuestions() external view returns (uint256) {
        return questionCounter;
    }

    /**
     * @dev Get active questions count
     */
    function getActiveQuestionsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < activeQuestionIds.length; i++) {
            if (questions[activeQuestionIds[i]].isActive) {
                count++;
            }
        }
        return count;
    }

    // ============ Match Management ============

    /**
     * @dev Create a new match
     */
    function createMatch(
        address _token,
        uint256 _entryFee,
        uint8 _maxPlayers,
        uint8 _questionsPerMatch,
        bool _autoStart
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(supportedTokens[_token], "Unsupported token");
        require(_entryFee >= MIN_ENTRY_FEE, "Entry fee too low");
        require(_maxPlayers >= 2 && _maxPlayers <= 10, "Invalid player count");
        require(
            _questionsPerMatch >= MIN_QUESTIONS && _questionsPerMatch <= MAX_QUESTIONS,
            "Invalid question count"
        );
        require(
            playerMatches[msg.sender].length < maxMatchesPerPlayer,
            "Match limit reached"
        );

        IERC20 token = IERC20(_token);
        require(token.balanceOf(msg.sender) >= _entryFee, "Insufficient balance");
        require(
            token.allowance(msg.sender, address(this)) >= _entryFee,
            "Insufficient allowance"
        );

        matchCounter++;
        uint256 matchId = matchCounter;

        Match storage newMatch = matches[matchId];
        newMatch.matchId = matchId;
        newMatch.token = _token;
        newMatch.entryFee = _entryFee;
        newMatch.maxPlayers = _maxPlayers;
        newMatch.questionsPerMatch = _questionsPerMatch;
        newMatch.autoStart = _autoStart;
        newMatch.prizePool = _entryFee;
        newMatch.escrowAmount = _entryFee;
        newMatch.status = MatchStatus.Waiting;
        newMatch.players.push(msg.sender);
        newMatch.currentPlayers = 1;
        newMatch.createdAt = block.timestamp;

        // Transfer tokens to escrow
        token.safeTransferFrom(msg.sender, address(this), _entryFee);
        escrowBalances[matchId][_token] += _entryFee;

        activeMatchIds.push(matchId);
        playerMatches[msg.sender].push(matchId);

        emit MatchCreated(matchId, msg.sender, _token, _entryFee, _maxPlayers, _questionsPerMatch);

        return matchId;
    }

    /**
     * @dev Join an existing match
     */
    function joinMatch(uint256 _matchId) external whenNotPaused nonReentrant {
        Match storage matchData = matches[_matchId];
        require(matchData.status == MatchStatus.Waiting, "Match not available");
        require(matchData.currentPlayers < matchData.maxPlayers, "Match full");
        require(
            block.timestamp < matchData.createdAt + MATCH_TIMEOUT,
            "Match expired"
        );
        require(!isPlayerInMatch(_matchId, msg.sender), "Already in match");

        IERC20 token = IERC20(matchData.token);
        require(
            token.balanceOf(msg.sender) >= matchData.entryFee,
            "Insufficient balance"
        );
        require(
            token.allowance(msg.sender, address(this)) >= matchData.entryFee,
            "Insufficient allowance"
        );

        matchData.players.push(msg.sender);
        matchData.currentPlayers++;
        matchData.prizePool += matchData.entryFee;
        matchData.escrowAmount += matchData.entryFee;

        // Transfer tokens to escrow
        token.safeTransferFrom(msg.sender, address(this), matchData.entryFee);
        escrowBalances[_matchId][matchData.token] += matchData.entryFee;

        playerMatches[msg.sender].push(_matchId);

        emit PlayerJoined(_matchId, msg.sender);

        // Auto-start if match is full and auto-start is enabled
        if (matchData.currentPlayers == matchData.maxPlayers && matchData.autoStart) {
            _startMatch(_matchId);
        }
    }

    /**
     * @dev Start a match (can be called by owner or auto-triggered)
     */
    function startMatch(uint256 _matchId) external onlyOwner whenNotPaused {
        _startMatch(_matchId);
    }

    /**
     * @dev Internal function to start a match
     */
    function _startMatch(uint256 _matchId) internal {
        Match storage matchData = matches[_matchId];
        require(matchData.status == MatchStatus.Waiting, "Match not in waiting state");
        require(matchData.currentPlayers >= 2, "Need at least 2 players");

        // Generate random questions
        uint256 seed = uint256(
            keccak256(abi.encodePacked(_matchId, block.timestamp, block.prevrandao))
        );
        matchData.questionIds = getRandomQuestions(matchData.questionsPerMatch, seed);

        matchData.status = MatchStatus.Active;
        matchData.startTime = block.timestamp;
        matchData.endTime = block.timestamp + (matchData.questionsPerMatch * ANSWER_TIMEOUT);

        // Remove from active matches list
        _removeFromActiveMatches(_matchId);

        emit MatchStarted(_matchId, matchData.questionIds);
    }

    /**
     * @dev Submit answer for a question
     */
    function submitAnswer(
        uint256 _matchId,
        uint256 _questionId,
        uint8 _answer
    ) external whenNotPaused {
        Match storage matchData = matches[_matchId];
        require(matchData.status == MatchStatus.Active, "Match not active");
        require(isPlayerInMatch(_matchId, msg.sender), "Not in this match");
        require(block.timestamp <= matchData.endTime, "Match time expired");
        require(_answer < 4, "Invalid answer");
        require(
            matchData.answers[msg.sender][_questionId] == 0 || 
            (matchData.answers[msg.sender][_questionId] == 0 && _answer == 0),
            "Answer already submitted"
        );

        // Store answer (add 1 to differentiate from unsubmitted)
        matchData.answers[msg.sender][_questionId] = _answer + 1;

        // Check if correct
        bool isCorrect = questions[_questionId].correctAnswer == _answer;
        if (isCorrect) {
            matchData.scores[msg.sender]++;
            playerStats[msg.sender].totalCorrectAnswers++;
        }

        emit AnswerSubmitted(_matchId, msg.sender, _questionId, _answer, isCorrect);

        // Auto-end match if all players answered all questions
        if (_checkAllPlayersAnswered(_matchId)) {
            _endMatch(_matchId);
        }
    }

    /**
     * @dev End a match (can be called by owner or auto-triggered)
     */
    function endMatch(uint256 _matchId) external onlyOwner whenNotPaused {
        _endMatch(_matchId);
    }

    /**
     * @dev Internal function to end a match
     */
    function _endMatch(uint256 _matchId) internal {
        Match storage matchData = matches[_matchId];
        require(matchData.status == MatchStatus.Active, "Match not active");

        matchData.status = MatchStatus.Completed;
        matchData.endTime = block.timestamp;
        completedMatchIds.push(_matchId);

        // Calculate winners
        address[] memory winners = _getWinners(_matchId);
        uint256[] memory scores = new uint256[](winners.length);
        
        for (uint256 i = 0; i < winners.length; i++) {
            scores[i] = matchData.scores[winners[i]];
            
            // Update player stats
            playerStats[winners[i]].totalWins++;
            playerStats[winners[i]].totalMatches++;
            playerStats[winners[i]].lastPlayedAt = block.timestamp;
            
            if (scores[i] > playerStats[winners[i]].highestScore) {
                playerStats[winners[i]].highestScore = scores[i];
            }
        }

        // Calculate prize per winner
        uint256 totalPrize = matchData.prizePool;
        uint256 platformFee = (totalPrize * platformFeePercentage) / 100;
        uint256 winnersPrize = totalPrize - platformFee;
        uint256 prizePerWinner = winnersPrize / winners.length;

        emit MatchEnded(_matchId, winners, scores, prizePerWinner);
    }

    /**
     * @dev Claim prize after match completion
     */
    function claimPrize(uint256 _matchId) external nonReentrant {
        Match storage matchData = matches[_matchId];
        require(matchData.status == MatchStatus.Completed, "Match not completed");
        require(isPlayerInMatch(_matchId, msg.sender), "Not in this match");
        require(
            !matchData.hasClaimedPrize[msg.sender],
            "Prize already claimed"
        );

        // Check if player is a winner
        address[] memory winners = _getWinners(_matchId);
        bool isWinner = false;
        for (uint256 i = 0; i < winners.length; i++) {
            if (winners[i] == msg.sender) {
                isWinner = true;
                break;
            }
        }
        require(isWinner, "Not a winner");

        // Calculate prize
        uint256 totalPrize = matchData.prizePool;
        uint256 platformFee = (totalPrize * platformFeePercentage) / 100;
        uint256 winnersPrize = totalPrize - platformFee;
        uint256 prizePerWinner = winnersPrize / winners.length;

        matchData.hasClaimedPrize[msg.sender] = true;
        hasClaimedPrize[_matchId][msg.sender] = true;

        // Update stats
        playerStats[msg.sender].totalEarnings += prizePerWinner;

        // Release from escrow
        require(
            escrowBalances[_matchId][matchData.token] >= prizePerWinner,
            "Insufficient escrow"
        );
        escrowBalances[_matchId][matchData.token] -= prizePerWinner;

        IERC20(matchData.token).safeTransfer(msg.sender, prizePerWinner);

        emit PrizeClaimed(_matchId, msg.sender, prizePerWinner);
    }

    /**
     * @dev Cancel match and refund players (only if waiting)
     */
    function cancelMatch(uint256 _matchId) external {
        Match storage matchData = matches[_matchId];
        require(
            matchData.status == MatchStatus.Waiting,
            "Can only cancel waiting matches"
        );
        require(
            msg.sender == matchData.players[0] || msg.sender == owner(),
            "Only creator or owner can cancel"
        );

        matchData.status = MatchStatus.Cancelled;
        _removeFromActiveMatches(_matchId);

        // Refund all players
        for (uint256 i = 0; i < matchData.players.length; i++) {
            address player = matchData.players[i];
            uint256 refundAmount = matchData.entryFee;
            
            escrowBalances[_matchId][matchData.token] -= refundAmount;
            IERC20(matchData.token).safeTransfer(player, refundAmount);
            
            emit RefundIssued(_matchId, player, refundAmount);
        }
    }

    // ============ View Functions ============

    /**
     * @dev Get match details
     */
    function getMatchDetails(uint256 _matchId) external view returns (
        uint256 matchId,
        address[] memory players,
        address token,
        uint256 entryFee,
        uint256 prizePool,
        MatchStatus status,
        uint256 startTime,
        uint256 endTime,
        uint8 currentPlayers,
        uint8 maxPlayers,
        uint8 questionsPerMatch
    ) {
        Match storage matchData = matches[_matchId];
        return (
            matchData.matchId,
            matchData.players,
            matchData.token,
            matchData.entryFee,
            matchData.prizePool,
            matchData.status,
            matchData.startTime,
            matchData.endTime,
            matchData.currentPlayers,
            matchData.maxPlayers,
            matchData.questionsPerMatch
        );
    }

    /**
     * @dev Get match questions
     */
    function getMatchQuestions(uint256 _matchId) external view returns (uint256[] memory) {
        return matches[_matchId].questionIds;
    }

    /**
     * @dev Get player score in a match
     */
    function getPlayerScore(uint256 _matchId, address _player) external view returns (uint256) {
        return matches[_matchId].scores[_player];
    }

    /**
     * @dev Get all active matches
     */
    function getActiveMatches() external view returns (uint256[] memory) {
        return activeMatchIds;
    }

    /**
     * @dev Get player's match history
     */
    function getPlayerMatches(address _player) external view returns (uint256[] memory) {
        return playerMatches[_player];
    }

    /**
     * @dev Get player statistics
     */
    function getPlayerStats(address _player) external view returns (
        uint256 totalWins,
        uint256 totalEarnings,
        uint256 totalMatches,
        uint256 totalCorrectAnswers,
        uint256 highestScore
    ) {
        PlayerStats storage stats = playerStats[_player];
        return (
            stats.totalWins,
            stats.totalEarnings,
            stats.totalMatches,
            stats.totalCorrectAnswers,
            stats.highestScore
        );
    }

    /**
     * @dev Get leaderboard (top players by earnings)
     */
    function getTopPlayersByEarnings(uint256 _limit) external view returns (
        address[] memory players,
        uint256[] memory earnings
    ) {
        // Note: This is a simple implementation. For production, consider off-chain indexing
        // or a more sophisticated on-chain ranking system
        
        // This would need to be implemented with a proper data structure
        // For now, returning empty arrays as placeholder
        players = new address[](_limit);
        earnings = new uint256[](_limit);
        return (players, earnings);
    }

    // ============ Internal Helper Functions ============

    function isPlayerInMatch(uint256 _matchId, address _player) internal view returns (bool) {
        Match storage matchData = matches[_matchId];
        for (uint256 i = 0; i < matchData.players.length; i++) {
            if (matchData.players[i] == _player) {
                return true;
            }
        }
        return false;
    }

    function _getWinners(uint256 _matchId) internal view returns (address[] memory) {
        Match storage matchData = matches[_matchId];
        uint256 maxScore = 0;

        // Find max score
        for (uint256 i = 0; i < matchData.players.length; i++) {
            uint256 score = matchData.scores[matchData.players[i]];
            if (score > maxScore) {
                maxScore = score;
            }
        }

        // Count winners
        uint256 winnerCount = 0;
        for (uint256 i = 0; i < matchData.players.length; i++) {
            if (matchData.scores[matchData.players[i]] == maxScore) {
                winnerCount++;
            }
        }

        // Build winners array
        address[] memory winners = new address[](winnerCount);
        uint256 index = 0;
        for (uint256 i = 0; i < matchData.players.length; i++) {
            if (matchData.scores[matchData.players[i]] == maxScore) {
                winners[index] = matchData.players[i];
                index++;
            }
        }

        return winners;
    }

    function _checkAllPlayersAnswered(uint256 _matchId) internal view returns (bool) {
        Match storage matchData = matches[_matchId];
        
        for (uint256 i = 0; i < matchData.players.length; i++) {
            address player = matchData.players[i];
            for (uint256 j = 0; j < matchData.questionIds.length; j++) {
                uint256 qId = matchData.questionIds[j];
                if (matchData.answers[player][qId] == 0) {
                    return false;
                }
            }
        }
        
        return true;
    }

    function _removeFromActiveMatches(uint256 _matchId) internal {
        for (uint256 i = 0; i < activeMatchIds.length; i++) {
            if (activeMatchIds[i] == _matchId) {
                activeMatchIds[i] = activeMatchIds[activeMatchIds.length - 1];
                activeMatchIds.pop();
                break;
            }
        }
    }

    // ============ Admin Functions ============

    function addSupportedToken(address _token) external onlyOwner {
        supportedTokens[_token] = true;
    }

    function removeSupportedToken(address _token) external onlyOwner {
        supportedTokens[_token] = false;
    }

    function setPlatformFee(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 10, "Fee too high");
        platformFeePercentage = _feePercentage;
    }

    function setMaxMatchesPerPlayer(uint256 _max) external onlyOwner {
        maxMatchesPerPlayer = _max;
    }

    function withdrawPlatformFees(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}
