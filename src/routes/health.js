const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Health check endpoint
router.get('/', asyncHandler(async (req, res) => {
    const startTime = Date.now();

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memory = {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    };

    // Blockchain connection check
    let blockchainStatus = {
        connected: false,
        network: null,
        blockNumber: null,
        chainId: null,
        gasPrice: null,
        error: null
    };

    try {
        const { Web3 } = require('web3');
        const web3 = new Web3(process.env.BNB_TESTNET_RPC);

        // Check connection with timeout
        const connectionPromise = Promise.race([
            (async () => {
                const [blockNumber, chainId, gasPrice] = await Promise.all([
                    web3.eth.getBlockNumber(),
                    web3.eth.getChainId(),
                    web3.eth.getGasPrice()
                ]);

                // Determine network name from chain ID
                const networkNames = {
                    1: 'Ethereum Mainnet',
                    56: 'BNB Smart Chain',
                    97: 'BNB Testnet',
                    137: 'Polygon',
                    80001: 'Polygon Mumbai'
                };
                const network = networkNames[Number(chainId)] || `Chain ID ${chainId}`;

                return {
                    connected: true,
                    network,
                    blockNumber: Number(blockNumber),
                    chainId: Number(chainId),
                    gasPrice: web3.utils.fromWei(gasPrice.toString(), 'gwei') + ' Gwei',
                    error: null
                };
            })(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timeout')), 5000)
            )
        ]);

        blockchainStatus = await connectionPromise;
    } catch (error) {
        logger.error('Blockchain health check failed:', error.message);
        blockchainStatus.error = error.message;
    }

    const responseTime = Date.now() - startTime;

    const healthData = {
        success: true,
        status: blockchainStatus.connected ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: `${responseTime}ms`,
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        blockchain: blockchainStatus,
        memory,
        system: {
            platform: process.platform,
            nodeVersion: process.version,
            pid: process.pid
        }
    };

    // Return 503 if blockchain is not connected
    const statusCode = blockchainStatus.connected ? 200 : 503;

    res.status(statusCode).json(healthData);
}));

// Detailed health check
router.get('/detailed', asyncHandler(async (req, res) => {
    const { Web3 } = require('web3');
    const web3 = new Web3(process.env.BNB_TESTNET_RPC);

    const [blockNumber, chainId, gasPrice, peerCount] = await Promise.all([
        web3.eth.getBlockNumber(),
        web3.eth.getChainId(),
        web3.eth.getGasPrice(),
        web3.eth.net.getPeerCount().catch(() => 0)
    ]);

    const latestBlock = await web3.eth.getBlock(blockNumber);

    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        blockchain: {
            connected: true,
            rpcUrl: process.env.BNB_TESTNET_RPC,
            chainId: Number(chainId),
            blockNumber: Number(blockNumber),
            blockTimestamp: new Date(Number(latestBlock.timestamp) * 1000).toISOString(),
            gasPrice: web3.utils.fromWei(gasPrice.toString(), 'gwei') + ' Gwei',
            peerCount: Number(peerCount),
            difficulty: latestBlock.difficulty?.toString() || 'N/A',
            transactions: latestBlock.transactions?.length || 0
        }
    });
}));

// Readiness check (for Kubernetes/Docker)
router.get('/ready', asyncHandler(async (req, res) => {
    const { Web3 } = require('web3');
    const web3 = new Web3(process.env.BNB_TESTNET_RPC);

    try {
        await web3.eth.getBlockNumber();
        res.status(200).json({ ready: true });
    } catch (error) {
        res.status(503).json({ ready: false, error: error.message });
    }
}));

// Liveness check (for Kubernetes/Docker)
router.get('/live', (req, res) => {
    res.status(200).json({ alive: true });
});

module.exports = router;
