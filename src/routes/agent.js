const express = require('express');
const router = express.Router();
const agentOrchestrator = require('../services/agent/AgentOrchestrator');
const logger = require('../utils/logger');

/**
 * Agent Orchestrator API Routes
 * Endpoints for Quack × ChainGPT Super Web3 Agent workflows
 */

/**
 * @route   POST /api/agent/research
 * @desc    Execute research and explain workflow
 * @access  Public
 */
router.post('/research', async (req, res) => {
    try {
        const { query, userId = 'default' } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required'
            });
        }

        const result = await agentOrchestrator.researchAndExplain(query, userId);

        res.json(result);
    } catch (error) {
        logger.error('Research workflow error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/agent/generate-contract
 * @desc    Execute generate, audit, and optionally deploy contract workflow
 * @access  Public
 */
router.post('/generate-contract', async (req, res) => {
    try {
        const { description, autoDeploy = false, network = 'bnb-testnet', userId = 'default' } = req.body;

        if (!description) {
            return res.status(400).json({
                success: false,
                error: 'Contract description is required'
            });
        }

        const result = await agentOrchestrator.generateAndAuditContract(description, {
            autoDeploy,
            network,
            userId
        });

        res.json(result);
    } catch (error) {
        logger.error('Generate contract workflow error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/agent/defi-action
 * @desc    Execute DeFi action (swap, stake, etc.)
 * @access  Public
 */
router.post('/defi-action', async (req, res) => {
    try {
        const {
            action,
            fromToken,
            toToken,
            amount,
            slippage = 0.5,
            network = 'bnb-testnet',
            userId = 'default'
        } = req.body;

        if (!action) {
            return res.status(400).json({
                success: false,
                error: 'Action is required'
            });
        }

        if (action === 'swap' && (!fromToken || !toToken || !amount)) {
            return res.status(400).json({
                success: false,
                error: 'Swap requires fromToken, toToken, and amount'
            });
        }

        const result = await agentOrchestrator.executeDeFiAction({
            action,
            fromToken,
            toToken,
            amount,
            slippage,
            network,
            userId
        });

        res.json(result);
    } catch (error) {
        logger.error('DeFi action workflow error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/agent/execute-action
 * @desc    Execute unified action
 * @access  Public
 */
router.post('/execute-action', async (req, res) => {
    try {
        const { actionType, actionData, paymentTxHash } = req.body;

        if (!actionType || !actionData) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: actionType, actionData'
            });
        }

        const result = await agentOrchestrator.executeAction(actionType, actionData, paymentTxHash);

        res.json(result);
    } catch (error) {
        logger.error('Execute action workflow error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/agent/discover-and-negotiate
 * @desc    Discover a service and negotiate terms autonomously
 * @access  Public
 */
router.post('/discover-and-negotiate', async (req, res) => {
    try {
        const { query, category, userId = 'default' } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required'
            });
        }

        const result = await agentOrchestrator.discoverAndNegotiate(query, category, userId);

        res.json(result);
    } catch (error) {
        logger.error('Discovery and negotiation workflow error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/agent/workflow/execute
 * @desc    Execute generic workflow
 * @access  Public
 */
router.post('/workflow/execute', async (req, res) => {
    try {
        const { workflowType, params } = req.body;

        if (!workflowType || !params) {
            return res.status(400).json({
                success: false,
                error: 'workflowType and params are required'
            });
        }

        const result = await agentOrchestrator.executeWorkflow(workflowType, params);

        res.json(result);
    } catch (error) {
        logger.error('Execute workflow error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/agent/workflow/:workflowId/status
 * @desc    Get workflow status
 * @access  Public
 */
router.get('/workflow/:workflowId/status', async (req, res) => {
    try {
        const { workflowId } = req.params;

        const status = agentOrchestrator.getWorkflowStatus(workflowId);

        res.json({
            success: true,
            workflow: status
        });
    } catch (error) {
        logger.error('Get workflow status error:', error.message);
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/agent/stats
 * @desc    Get agent orchestrator statistics
 * @access  Public
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = agentOrchestrator.getStatistics();

        res.json({
            success: true,
            stats
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
