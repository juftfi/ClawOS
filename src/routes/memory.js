const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const membaseService = require('../services/memory/MembaseService');
const conversationManager = require('../services/memory/ConversationManager');
const preferenceManager = require('../services/memory/PreferenceManager');
const logger = require('../utils/logger');

/**
 * @route   GET /api/memory/conversation/:agentId
 * @desc    Get conversation history
 * @access  Public
 */
router.get('/conversation/:agentId', asyncHandler(async (req, res) => {
    const { agentId } = req.params;
    const { limit = 50 } = req.query;

    const history = await membaseService.getConversationHistory(agentId, parseInt(limit));

    res.json({
        success: true,
        data: {
            agent_id: agentId,
            message_count: history.length,
            messages: history
        },
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/memory/conversation
 * @desc    Save conversation messages (user + AI response)
 * @access  Public
 */
router.post('/conversation', asyncHandler(async (req, res) => {
    const { agentId, userMessage, aiResponse } = req.body;

    if (!agentId || !userMessage || !aiResponse) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: agentId, userMessage, aiResponse'
        });
    }

    try {
        // Save user message
        await conversationManager.addMessage(agentId, userMessage, 'user', {});

        // Save AI response
        await conversationManager.addMessage(agentId, aiResponse, 'assistant', {});

        logger.info(`Conversation saved for ${agentId}`);

        res.json({
            success: true,
            message: 'Conversation saved successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Save conversation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}));

/**
 * @route   POST /api/memory/conversation/init
 * @desc    Initialize new conversation
 * @access  Public
 */
router.post('/conversation/init', asyncHandler(async (req, res) => {
    const { agentId, userId } = req.body;

    if (!agentId || !userId) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: agentId, userId'
        });
    }

    const result = await conversationManager.initializeConversation(agentId, userId);

    res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/memory/save-message
 * @desc    Save conversation message
 * @access  Public
 */
router.post('/save-message', asyncHandler(async (req, res) => {
    const { agentId, message, role, metadata } = req.body;

    if (!agentId || !message || !role) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: agentId, message, role'
        });
    }

    const result = await conversationManager.addMessage(agentId, message, role, metadata || {});

    res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/memory/conversation/:agentId/context
 * @desc    Get conversation context for AI
 * @access  Public
 */
router.get('/conversation/:agentId/context', asyncHandler(async (req, res) => {
    const { agentId } = req.params;
    const { messages = 10 } = req.query;

    const context = await conversationManager.getContext(agentId, parseInt(messages));

    res.json({
        success: true,
        data: {
            agent_id: agentId,
            context_messages: context.length,
            messages: context
        },
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/memory/conversation/:agentId/summary
 * @desc    Get conversation summary
 * @access  Public
 */
router.get('/conversation/:agentId/summary', asyncHandler(async (req, res) => {
    const { agentId } = req.params;

    const summary = await conversationManager.summarizeConversation(agentId);

    res.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   DELETE /api/memory/conversation/:agentId/old
 * @desc    Clear old conversations
 * @access  Public
 */
router.delete('/conversation/:agentId/old', asyncHandler(async (req, res) => {
    const { agentId } = req.params;
    const { days = 30 } = req.query;

    const result = await conversationManager.clearOldConversations(agentId, parseInt(days));

    res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/memory/conversation/:agentId/stats
 * @desc    Get conversation statistics
 * @access  Public
 */
router.get('/conversation/:agentId/stats', asyncHandler(async (req, res) => {
    const { agentId } = req.params;

    const stats = await conversationManager.getConversationStats(agentId);

    res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/memory/conversation/:agentId/export
 * @desc    Export full conversation
 * @access  Public
 */
router.get('/conversation/:agentId/export', asyncHandler(async (req, res) => {
    const { agentId } = req.params;

    const exported = await conversationManager.exportConversation(agentId);

    res.json({
        success: true,
        data: exported,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/memory/preferences/:userId
 * @desc    Get user preferences
 * @access  Public
 */
router.get('/preferences/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const preferences = await preferenceManager.getAllPreferences(userId);

    res.json({
        success: true,
        data: {
            user_id: userId,
            preferences
        },
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/memory/set-preference
 * @desc    Set user preference
 * @access  Public
 */
router.post('/set-preference', asyncHandler(async (req, res) => {
    const { userId, category, key, value } = req.body;

    if (!userId || !category || !key || value === undefined) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: userId, category, key, value'
        });
    }

    const result = await preferenceManager.setPreference(userId, category, key, value);

    res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/memory/preference/:userId/:category/:key
 * @desc    Get specific preference
 * @access  Public
 */
router.get('/preference/:userId/:category/:key', asyncHandler(async (req, res) => {
    const { userId, category, key } = req.params;

    const value = await preferenceManager.getPreference(userId, category, key);

    res.json({
        success: true,
        data: {
            user_id: userId,
            category,
            key,
            value
        },
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/memory/preferences/risk-tolerance
 * @desc    Update risk tolerance
 * @access  Public
 */
router.post('/preferences/risk-tolerance', asyncHandler(async (req, res) => {
    const { userId, level } = req.body;

    if (!userId || !level) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: userId, level'
        });
    }

    const result = await preferenceManager.updateRiskTolerance(userId, level);

    res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/memory/preferences/gas-strategy
 * @desc    Update gas strategy
 * @access  Public
 */
router.post('/preferences/gas-strategy', asyncHandler(async (req, res) => {
    const { userId, strategy } = req.body;

    if (!userId || !strategy) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: userId, strategy'
        });
    }

    const result = await preferenceManager.updateGasStrategy(userId, strategy);

    res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/memory/preferences/slippage
 * @desc    Update slippage tolerance
 * @access  Public
 */
router.post('/preferences/slippage', asyncHandler(async (req, res) => {
    const { userId, slippage } = req.body;

    if (!userId || slippage === undefined) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: userId, slippage'
        });
    }

    const result = await preferenceManager.updateSlippageTolerance(userId, slippage);

    res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/memory/preferences/reset
 * @desc    Reset preferences to defaults
 * @access  Public
 */
router.post('/preferences/reset', asyncHandler(async (req, res) => {
    const { userId, category } = req.body;

    if (!userId) {
        return res.status(400).json({
            success: false,
            error: 'Missing required field: userId'
        });
    }

    const result = await preferenceManager.resetPreferences(userId, category);

    res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/memory/contracts
 * @desc    List stored contract templates
 * @access  Public
 */
router.get('/contracts', asyncHandler(async (req, res) => {
    const { limit = 100 } = req.query;

    const contracts = await membaseService.queryMemory('contracts', {}, parseInt(limit));

    res.json({
        success: true,
        data: {
            count: contracts.length,
            contracts: contracts.map(c => ({
                name: c.name,
                created_at: c.created_at,
                updated_at: c.updated_at
            }))
        },
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/memory/contract/:name
 * @desc    Get contract template
 * @access  Public
 */
router.get('/contract/:name', asyncHandler(async (req, res) => {
    const { name } = req.params;

    const contract = await membaseService.getContractTemplate(name);

    if (!contract) {
        return res.status(404).json({
            success: false,
            error: `Contract template '${name}' not found`
        });
    }

    res.json({
        success: true,
        data: contract,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/memory/store-contract
 * @desc    Store contract template
 * @access  Public
 */
router.post('/store-contract', asyncHandler(async (req, res) => {
    const { name, code, abi } = req.body;

    if (!name || !code || !abi) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: name, code, abi'
        });
    }

    const result = await membaseService.storeContractTemplate(name, code, abi);

    res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/memory/transactions/:agentId
 * @desc    Get transaction log
 * @access  Public
 */
router.get('/transactions/:agentId', asyncHandler(async (req, res) => {
    const { agentId } = req.params;
    const { limit = 100 } = req.query;

    const transactions = await membaseService.getTransactionLog(agentId, parseInt(limit));

    res.json({
        success: true,
        data: {
            agent_id: agentId,
            transaction_count: transactions.length,
            transactions
        },
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/memory/store-transaction
 * @desc    Store transaction log
 * @access  Public
 */
router.post('/store-transaction', asyncHandler(async (req, res) => {
    const { txHash, txDetails } = req.body;

    if (!txHash || !txDetails) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: txHash, txDetails'
        });
    }

    const result = await membaseService.storeTransaction(txHash, txDetails);

    res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/memory/stats
 * @desc    Get memory storage statistics
 * @access  Public
 */
router.get('/stats', asyncHandler(async (req, res) => {
    const stats = membaseService.getStats();

    res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/memory/query
 * @desc    Advanced memory query
 * @access  Public
 */
router.post('/query', asyncHandler(async (req, res) => {
    const { collection, filters, limit = 100 } = req.body;

    if (!collection) {
        return res.status(400).json({
            success: false,
            error: 'Missing required field: collection'
        });
    }

    const results = await membaseService.queryMemory(collection, filters || {}, parseInt(limit));

    res.json({
        success: true,
        data: {
            collection,
            count: results.length,
            results
        },
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/memory/stats
 * @desc    Get memory statistics
 * @access  Public
 */
router.get('/stats', asyncHandler(async (req, res) => {
    try {
        const stats = await membaseService.getStats();

        res.json({
            success: true,
            data: {
                totalConversations: stats.conversationCount || 0,
                totalMessages: stats.messageCount || 0,
                storageUsed: stats.storageSize || '0 KB',
                lastSync: stats.lastSync || new Date().toISOString(),
                hubUrl: stats.hubUrl || 'https://testnet.hub.membase.io',
                isConnected: stats.isConnected !== false
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Get memory stats error:', error);
        res.json({
            success: true,
            data: {
                totalConversations: 0,
                totalMessages: 0,
                storageUsed: '0 KB',
                lastSync: new Date().toISOString(),
                hubUrl: 'https://testnet.hub.membase.io',
                isConnected: false
            }
        });
    }
}));

/**
 * @route   POST /api/memory/aip/store
 * @desc    Store verifiable memory via AIP
 * @access  Public
 */
router.post('/aip/store', asyncHandler(async (req, res) => {
    const { agentId, content, metadata } = req.body;
    if (!agentId || !content) {
        return res.status(400).json({ success: false, error: 'Missing agentId or content' });
    }
    const result = await membaseService.storeAIP(agentId, content, metadata);
    res.json({ success: true, data: result });
}));

/**
 * @route   GET /api/memory/aip/query/:agentId
 * @desc    Query verifiable memory via AIP
 * @access  Public
 */
router.get('/aip/query/:agentId', asyncHandler(async (req, res) => {
    const { agentId } = req.params;
    const history = await membaseService.queryAIP(agentId);
    res.json({ success: true, data: history });
}));

module.exports = router;
