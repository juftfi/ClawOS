require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { csrfProtectionDev } = require('./middleware/csrfProtection');
const healthRouter = require('./routes/health');
const logger = require('./utils/logger');

// Security: ensure TLS verification is not disabled accidentally.
// Some environments mistakenly set NODE_TLS_REJECT_UNAUTHORIZED=0 which disables certificate validation.
// Remove that setting at process startup to avoid insecure behavior.
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  // delete the var so Node uses default certificate verification
  delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  // logger may not yet be initialized in some early error paths, but we have it now
  logger.warn('NODE_TLS_REJECT_UNAUTHORIZED was set to 0. It has been removed to enforce TLS certificate validation.');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://agent-os-web3.vercel.app',
  'https://agentos.vercel.app',
  'https://agentos-production.up.railway.app',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware (MUST come before routes)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
app.use(cookieParser());

// Rate limiting middleware (applied to all routes)
app.use('/api/', apiLimiter);

// CSRF protection (development mode - only logs warnings)
// Switch to csrfProtection in production
app.use(csrfProtectionDev);

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Routes
const authRouter = require('./routes/auth');
const chainGPTRouter = require('./routes/chainGPT');
const blockchainRouter = require('./routes/blockchain');
const memoryRouter = require('./routes/memory');
const x402Router = require('./routes/x402');
const previewRouter = require('./routes/preview');
const auditRouter = require('./routes/audit');
const agentRouter = require('./routes/agent');
const securityRouter = require('./routes/security');
const quackRouter = require('./routes/quack');

app.use('/api/health', healthRouter);
app.use('/api/auth', authLimiter, authRouter); // Apply stricter rate limiting to auth routes
app.use('/api/ai', chainGPTRouter);
app.use('/api/blockchain', blockchainRouter);
app.use('/api/memory', memoryRouter);
app.use('/api/payment', x402Router);
app.use('/api/policy', x402Router);
app.use('/api/signature', x402Router);
app.use('/api/preview', previewRouter);
app.use('/api/audit', auditRouter);
app.use('/api/agent', agentRouter);
app.use('/api/security', securityRouter);
app.use('/api/quack', quackRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AgentOS Web3 API - Three Bounty Integration',
    version: '1.0.0',
    bounties: [
      'Quack × ChainGPT (Super Web3 Agent on BNB Testnet)',
      'Unibase (Immortal AI Agent with Membase)'
    ],
    networks: [
      'BNB Smart Chain Testnet'
    ],
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

let server = null;

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  if (server && server.close) {
    server.close(() => {
      logger.info('HTTP server closed');

      // Close database connections, cleanup resources, etc.
      process.exit(0);
    });
  } else {
    logger.info('No HTTP server to close');
    process.exit(0);
  }

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Start server only when this file is run directly (avoid launching server during tests that `require` the app)
if (require.main === module) {
  server = app.listen(PORT, async () => {
    logger.info(`🚀 AgentOS Web3 API server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`\n📡 Network Configuration:`);
    logger.info(`  - BNB Testnet: ${process.env.BNB_TESTNET_RPC}`);
    logger.info(`\n🎯 Bounty Integrations:`);
    logger.info(`  ✅ Quack × ChainGPT (Super Web3 Agent)`);
    logger.info(`  ✅ Unibase (Immortal AI Agent)`);

    // Check blockchain connections on startup
    try {
      const multiNetworkService = require('./services/blockchain/MultiNetworkService');

      // Check BNB Testnet
      const bnbInfo = await multiNetworkService.getNetworkInfo('bnb-testnet');
      logger.info(`✅ Connected to BNB Testnet - Block #${bnbInfo.block_number}`);

      logger.info(`\n🌐 API Endpoints:`);
      logger.info(`  - Agent Orchestrator: http://localhost:${PORT}/api/agent`);
      logger.info(`  - ChainGPT: http://localhost:${PORT}/api/ai`);
      logger.info(`  - Memory: http://localhost:${PORT}/api/memory`);
    } catch (error) {
      logger.error(`❌ Failed to connect to networks: ${error.message}`);
    }
  });
}

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
