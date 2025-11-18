/**
 * Trivia Battle Backend Server
 * Handles WebSocket connections, question API, and matchmaking
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const redis = require('redis');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connections
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect();

// Matchmaking queues
const matchmakingQueues = {
  '1v1': [],
  '2v2': [],
  '4player': [],
};

// Active matches
const activeMatches = new Map();

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Get random questions
 */
app.get('/api/questions/random', async (req, res) => {
  try {
    const { category, difficulty, count = 10 } = req.query;

    let query = 'SELECT * FROM questions WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (difficulty) {
      query += ` AND difficulty = $${paramCount}`;
      params.push(difficulty);
      paramCount++;
    }

    query += ` ORDER BY RANDOM() LIMIT $${paramCount}`;
    params.push(parseInt(count));

    const result = await dbPool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

/**
 * Get question by ID
 */
app.get('/api/questions/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const result = await dbPool.query(
      'SELECT * FROM questions WHERE id = $1',
      [questionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

/**
 * Validate answer
 */
app.post('/api/questions/validate', async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    const result = await dbPool.query(
      'SELECT correct_answer FROM questions WHERE id = $1',
      [questionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const isCorrect = result.rows[0].correct_answer === answer;
    res.json({ correct: isCorrect });
  } catch (error) {
    console.error('Error validating answer:', error);
    res.status(500).json({ error: 'Failed to validate answer' });
  }
});

/**
 * Get questions by category
 */
app.get('/api/questions/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { difficulty, count = 10 } = req.query;

    let query = 'SELECT * FROM questions WHERE category = $1';
    const params = [category];
    let paramCount = 2;

    if (difficulty) {
      query += ` AND difficulty = $${paramCount}`;
      params.push(difficulty);
      paramCount++;
    }

    query += ` ORDER BY RANDOM() LIMIT $${paramCount}`;
    params.push(parseInt(count));

    const result = await dbPool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching questions by category:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

/**
 * Get categories
 */
app.get('/api/questions/categories', async (req, res) => {
  try {
    const result = await dbPool.query(
      'SELECT DISTINCT category FROM questions ORDER BY category'
    );
    const categories = result.rows.map((row) => row.category);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join matchmaking
  socket.on('joinMatchmaking', async ({ matchId, gameMode }) => {
    try {
      const queue = matchmakingQueues[gameMode] || matchmakingQueues['1v1'];
      
      // Check for available matches
      const availableMatch = queue.find((m) => m.currentPlayers < m.maxPlayers);
      
      if (availableMatch) {
        // Join existing match
        availableMatch.players.push({ socketId: socket.id, matchId });
        availableMatch.currentPlayers++;
        
        socket.join(`match:${availableMatch.matchId}`);
        socket.emit('matchFound', {
          matchId: availableMatch.matchId,
          players: availableMatch.players.map((p) => p.matchId),
          entryFee: availableMatch.entryFee,
        });

        // If match is full, start it
        if (availableMatch.currentPlayers === availableMatch.maxPlayers) {
          const index = queue.indexOf(availableMatch);
          queue.splice(index, 1);
          activeMatches.set(availableMatch.matchId, availableMatch);
          
          io.to(`match:${availableMatch.matchId}`).emit('matchStarted', {
            matchId: availableMatch.matchId,
          });
        }
      } else {
        // Create new match entry
        const newMatch = {
          matchId,
          players: [{ socketId: socket.id, matchId }],
          currentPlayers: 1,
          maxPlayers: gameMode === '1v1' ? 2 : gameMode === '2v2' ? 4 : 4,
          entryFee: '0.1', // Default, should come from client
          status: 'waiting',
        };
        
        queue.push(newMatch);
        socket.join(`match:${matchId}`);
      }
    } catch (error) {
      console.error('Matchmaking error:', error);
      socket.emit('error', { message: 'Matchmaking failed' });
    }
  });

  // Join specific match
  socket.on('joinMatch', ({ matchId }) => {
    socket.join(`match:${matchId}`);
    console.log(`Socket ${socket.id} joined match ${matchId}`);
  });

  // Submit answer
  socket.on('submitAnswer', ({ matchId, questionId, answer, timestamp }) => {
    const match = activeMatches.get(matchId);
    if (match) {
      // Update match state
      if (!match.playerAnswers) {
        match.playerAnswers = {};
      }
      if (!match.playerAnswers[questionId]) {
        match.playerAnswers[questionId] = {};
      }
      match.playerAnswers[questionId][socket.id] = {
        answer,
        timestamp,
      };

      // Broadcast to other players in match
      socket.to(`match:${matchId}`).emit('answerSubmitted', {
        matchId,
        questionId,
        player: socket.id,
        timestamp,
      });

      // Emit back to sender for confirmation
      socket.emit('answerReceived', {
        matchId,
        questionId,
        success: true,
      });
    }
  });

  // Player ready
  socket.on('playerReady', ({ matchId }) => {
    const match = activeMatches.get(matchId);
    if (match) {
      match.readyPlayers = (match.readyPlayers || 0) + 1;
      
      if (match.readyPlayers === match.maxPlayers) {
        // All players ready, start game
        io.to(`match:${matchId}`).emit('allPlayersReady', { matchId });
      }
    }
  });

  // Request match status
  socket.on('getMatchStatus', ({ matchId }) => {
    const match = activeMatches.get(matchId);
    if (match) {
      socket.emit('matchStatus', {
        matchId,
        status: match.status,
        currentPlayers: match.currentPlayers,
        maxPlayers: match.maxPlayers,
      });
    }
  });

  // Player leave match
  socket.on('leaveMatch', ({ matchId }) => {
    socket.leave(`match:${matchId}`);
    const match = activeMatches.get(matchId);
    if (match) {
      match.players = match.players.filter((p) => p.socketId !== socket.id);
      match.currentPlayers--;
      
      // Notify other players
      socket.to(`match:${matchId}`).emit('playerLeft', {
        matchId,
        player: socket.id,
      });
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Clean up matchmaking queues
    Object.keys(matchmakingQueues).forEach((mode) => {
      matchmakingQueues[mode] = matchmakingQueues[mode].filter(
        (match) => match.players.every((p) => p.socketId !== socket.id)
      );
    });

    // Clean up active matches
    activeMatches.forEach((match, matchId) => {
      const playerIndex = match.players.findIndex((p) => p.socketId === socket.id);
      if (playerIndex !== -1) {
        match.players.splice(playerIndex, 1);
        match.currentPlayers--;
        
        // Notify other players
        io.to(`match:${matchId}`).emit('playerLeft', {
          matchId,
          player: socket.id,
        });

        // If no players left, remove match
        if (match.players.length === 0) {
          activeMatches.delete(matchId);
        }
      }
    });
  });
});

// Question update broadcaster (called by game timer)
function broadcastQuestionUpdate(matchId, questionIndex, question, timeRemaining) {
  io.to(`match:${matchId}`).emit('questionUpdate', {
    matchId,
    questionIndex,
    question,
    timeRemaining,
  });
}

// Score update broadcaster
function broadcastScoreUpdate(matchId, scores) {
  io.to(`match:${matchId}`).emit('scoreUpdate', {
    matchId,
    scores,
  });
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io, broadcastQuestionUpdate, broadcastScoreUpdate };

