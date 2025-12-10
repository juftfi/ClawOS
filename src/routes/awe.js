const express = require('express');
const router = express.Router();
const aweAgentService = require('../services/awe/AWEAgentService');
const x402PaymentService = require('../services/awe/X402PaymentService');
const q402PaymentService = require('../services/quack/Q402PaymentService');
const logger = require('../utils/logger');

/**
 * AWE Network API Routes
 * Endpoints for ERC-8004 agents and x402 payments on Base Sepolia
 */

/**
 * @route   POST /api/awe/agent/create
 * @desc    Create ERC-8004 compliant agent
 * @access  Public (testnet)
 */
router.post('/agent/create', async (req, res) => {
    try {
        const { name, description, capabilities } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Agent name is required'
            });
        }

        const result = await aweAgentService.createAgent({
            name,
            description: description || `AI Agent: ${name}`,
            capabilities: capabilities || []
        });

        res.json(result);
    } catch (error) {
        logger.error('Create agent error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/awe/create-agent
 * @desc    Create ERC-8004 compliant agent (frontend alias)
 * @access  Public (testnet)
 */
router.post('/create-agent', async (req, res) => {
    try {
        const { name, description, capabilities } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Agent name is required'
            });
        }

        const result = await aweAgentService.createAgent({
            name,
            description: description || `AI Agent: ${name}`,
            capabilities: capabilities || []
        });

        res.json(result);
    } catch (error) {
        logger.error('Create agent error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/awe/agent/:agentId
 * @desc    Get agent information
 * @access  Public
 */
router.get('/agent/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        const agent = aweAgentService.getAgent(agentId);

        res.json({
            success: true,
            agent
        });
    } catch (error) {
        logger.error('Get agent error:', error.message);
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/awe/agents
 * @desc    List all agents
 * @access  Public
 */
router.get('/agents', async (req, res) => {
    try {
        const agents = aweAgentService.listAgents();

        res.json({
            success: true,
            count: agents.length,
            agents
        });
    } catch (error) {
        logger.error('List agents error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/awe/agent/:agentId/balance
 * @desc    Get agent wallet balance
 * @access  Public
 */
router.get('/agent/:agentId/balance', async (req, res) => {
    try {
        const { agentId } = req.params;
        const balance = await aweAgentService.getAgentBalance(agentId);

        res.json({
            success: true,
            agentId,
            balance
        });
    } catch (error) {
        logger.error('Get agent balance error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/awe/payment/request
 * @desc    Create x402 payment request
 * @access  Public
 */
router.post('/payment/request', async (req, res) => {
    try {
        const { agentId, serviceType, metadata, network, customAmount } = req.body;

        if (!agentId || !serviceType) {
            return res.status(400).json({
                success: false,
                error: 'agentId and serviceType are required'
            });
        }

        let result;
        if (network && (network.includes('bnb') || network.includes('bsc'))) {
            // Q402 Service for BNB Testnet
            result = await q402PaymentService.createPaymentRequest(serviceType, agentId, metadata);
        } else {
            // Default to x402 Service for Base Sepolia
            result = x402PaymentService.createPaymentRequest(agentId, serviceType, metadata);
        }

        // If customAmount was provided (as decimal string), convert to smallest units and ensure it's a string
        if (customAmount) {
            try {
                const { parseUnits } = require('viem');
                // customAmount should be a decimal string like "0.1"
                const amountInSmallestUnits = parseUnits(customAmount.toString(), 6).toString();
                if (result.paymentRequest) {
                    result.paymentRequest.amount = amountInSmallestUnits;
                }
            } catch (parseErr) {
                logger.warn('Failed to parse custom amount:', parseErr.message);
                // Keep original amount if parsing fails
            }
        }

        res.json(result);
    } catch (error) {
        logger.error('Create payment request error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
            error: error.message
        });
    }
});

/**
 * @route   POST /api/awe/payment/accept
 * @desc    Accept x402 payment for service (with optional real USDC transfer)
 * @access  Public
 */
router.post('/payment/accept', async (req, res) => {
    try {
        const { agentId, serviceType, payer, executeTransfer = false } = req.body;

        if (!agentId || !serviceType || !payer) {
            return res.status(400).json({
                success: false,
                error: 'agentId, serviceType, and payer are required'
            });
        }

        const result = await x402PaymentService.acceptPayment(agentId, serviceType, payer, executeTransfer);

        res.json(result);
    } catch (error) {
        logger.error('Accept payment error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/awe/payment/execute-transfer
 * @desc    Execute REAL USDC transfer on Base Sepolia
 * @access  Public (for hackathon demo)
 */
router.post('/payment/execute-transfer', async (req, res) => {
    try {
        const { fromAddress, amount, serviceType } = req.body;

        if (!fromAddress || !amount || !serviceType) {
            return res.status(400).json({
                success: false,
                error: 'fromAddress, amount, and serviceType are required'
            });
        }

        const result = await x402PaymentService.executeUSDCTransfer(fromAddress, amount, serviceType);

        res.json(result);
    } catch (error) {
        logger.error('Execute transfer error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/awe/payment/history
 * @desc    Get all payment history
 * @access  Public
 */
router.get('/payment/history', async (req, res) => {
    try {
        const history = x402PaymentService.getAllPayments();
        res.json({
            success: true,
            count: history.length,
            history
        });
    } catch (error) {
        logger.error('Get payment history error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


/**
 * @route   GET /api/awe/payment/pricing
 * @desc    Get service pricing
 * @access  Public
 */
router.get('/payment/pricing', async (req, res) => {
    try {
        const pricing = x402PaymentService.getPricing();

        res.json({
            success: true,
            pricing
        });
    } catch (error) {
        logger.error('Get pricing error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/awe/stats
 * @desc    Get AWE Network statistics
 * @access  Public
 */
router.get('/stats', async (req, res) => {
    try {
        const agentStats = aweAgentService.getStatistics();
        const paymentStats = x402PaymentService.getStatistics();

        res.json({
            success: true,
            stats: {
                agents: agentStats,
                payments: paymentStats
            }
        });
    } catch (error) {
        logger.error('Get stats error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
