const llmService = require('../services/chainGPT/LLMService');
const generatorService = require('../services/chainGPT/GeneratorService');
const auditorService = require('../services/chainGPT/AuditorService');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class ChainGPTController {
    /**
     * Handle chat request
     */
    chat = asyncHandler(async (req, res) => {
        const { prompt, model, systemMessage } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'Prompt is required'
            });
        }

        logger.info('Processing chat request');

        const result = await llmService.chat(prompt, model, systemMessage);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Handle contract analysis request
     */
    analyzeContract = asyncHandler(async (req, res) => {
        const { contractCode } = req.body;

        if (!contractCode) {
            return res.status(400).json({
                success: false,
                error: 'Contract code is required'
            });
        }

        logger.info('Analyzing contract');

        const result = await llmService.analyzeContract(contractCode);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Handle contract generation request
     */
    generateContract = asyncHandler(async (req, res) => {
        const { description, type, params } = req.body;

        if (!description && !type) {
            return res.status(400).json({
                success: false,
                error: 'Description or type is required'
            });
        }

        logger.info(`Generating contract: ${type || 'custom'}`);

        let result;

        switch (type?.toLowerCase()) {
            case 'erc20':
                result = await generatorService.generateERC20(params || {});
                break;
            case 'erc721':
            case 'nft':
                result = await generatorService.generateERC721(params || {});
                break;
            case 'swap':
                result = await generatorService.generateSwapContract(
                    params?.fromToken || 'TokenA',
                    params?.toToken || 'TokenB'
                );
                break;
            case 'transfer':
                result = await generatorService.generateTransferContract();
                break;
            default:
                result = await llmService.generateSmartContract(description);
        }

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Handle contract audit request
     */
    auditContract = asyncHandler(async (req, res) => {
        const { contractCode, auditType } = req.body;

        if (!contractCode) {
            return res.status(400).json({
                success: false,
                error: 'Contract code is required'
            });
        }

        logger.info(`Auditing contract: ${auditType || 'full'}`);

        let result;

        switch (auditType?.toLowerCase()) {
            case 'security':
                result = await auditorService.checkSecurity(contractCode);
                break;
            case 'vulnerabilities':
                result = await auditorService.findVulnerabilities(contractCode);
                break;
            case 'report':
                result = await auditorService.getAuditReport(contractCode);
                break;
            default:
                result = await auditorService.auditContract(contractCode);
        }

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Handle transaction explanation request
     */
    explainTransaction = asyncHandler(async (req, res) => {
        const { transactionData } = req.body;

        if (!transactionData) {
            return res.status(400).json({
                success: false,
                error: 'Transaction data is required'
            });
        }

        logger.info('Explaining transaction');

        const result = await llmService.explainTransaction(transactionData);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Handle multi-turn conversation request
     */
    conversation = asyncHandler(async (req, res) => {
        const { messages, model } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Messages array is required'
            });
        }

        // Validate message format
        const validMessages = messages.every(msg =>
            msg.role && msg.content &&
            ['system', 'user', 'assistant'].includes(msg.role)
        );

        if (!validMessages) {
            return res.status(400).json({
                success: false,
                error: 'Invalid message format. Each message must have role and content.'
            });
        }

        logger.info(`Processing conversation with ${messages.length} messages`);

        const result = await llmService.conversation(messages, model);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Generate ERC20 token
     */
    generateERC20 = asyncHandler(async (req, res) => {
        const params = req.body;

        logger.info('Generating ERC20 token');

        const result = await generatorService.generateERC20(params);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Generate ERC721 NFT
     */
    generateERC721 = asyncHandler(async (req, res) => {
        const params = req.body;

        logger.info('Generating ERC721 NFT');

        const result = await generatorService.generateERC721(params);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Security check
     */
    securityCheck = asyncHandler(async (req, res) => {
        const { contractCode } = req.body;

        if (!contractCode) {
            return res.status(400).json({
                success: false,
                error: 'Contract code is required'
            });
        }

        logger.info('Performing security check');

        const result = await auditorService.checkSecurity(contractCode);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Find vulnerabilities
     */
    findVulnerabilities = asyncHandler(async (req, res) => {
        const { contractCode } = req.body;

        if (!contractCode) {
            return res.status(400).json({
                success: false,
                error: 'Contract code is required'
            });
        }

        logger.info('Finding vulnerabilities');

        const result = await auditorService.findVulnerabilities(contractCode);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Handle market narrative request
     */
    getMarketNarrative = asyncHandler(async (req, res) => {
        const { token } = req.body;
        const result = await llmService.getMarketNarrative(token);
        res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    });

    /**
     * Handle trading assistant request
     */
    getTradingAssistant = asyncHandler(async (req, res) => {
        const { token } = req.body;
        if (!token) return res.status(400).json({ success: false, error: 'Token is required' });
        const result = await llmService.getTradingAssistant(token);
        res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    });

    /**
     * Handle web3 news request
     */
    getWeb3News = asyncHandler(async (req, res) => {
        const { query } = req.body;
        const result = await llmService.getWeb3News(query);
        res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    });

    /**
     * Clear LLM cache
     */
    clearCache = asyncHandler(async (req, res) => {
        logger.info('Clearing LLM cache');

        llmService.clearCache();

        res.json({
            success: true,
            message: 'Cache cleared successfully',
            timestamp: new Date().toISOString()
        });
    });
}

module.exports = new ChainGPTController();
