require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const healthRouter = require('./routes/health');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request timestamp
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routes
const chainGPTRouter = require('./routes/chainGPT');
const blockchainRouter = require('./routes/blockchain');
const memoryRouter = require('./routes/memory');
const x402Router = require('./routes/x402');
app.use('/api/health', healthRouter);
app.use('/api/ai', chainGPTRouter);
app.use('/api/blockchain', blockchainRouter);
app.use('/api/memory', memoryRouter);
app.use('/api/payment', x402Router);
app.use('/api/policy', x402Router);
app.use('/api/signature', x402Router);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AgentOS Web3 API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    logger.info('HTTP server closed');

    // Close database connections, cleanup resources, etc.
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`🚀 AgentOS Web3 API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`BNB Testnet RPC: ${process.env.BNB_TESTNET_RPC}`);

  // Check blockchain connection on startup
  try {
    const { Web3 } = require('web3');
    const web3 = new Web3(process.env.BNB_TESTNET_RPC);
    const blockNumber = await web3.eth.getBlockNumber();
    logger.info(`✅ Connected to BNB Testnet - Block #${blockNumber}`);
  } catch (error) {
    logger.error(`❌ Failed to connect to BNB Testnet: ${error.message}`);
  }
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
