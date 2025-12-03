const express = require('express');
const router = express.Router();
const chainGPTController = require('../controllers/chainGPTController');
const { validateFields, validateTypes } = require('../middleware/validation');

/**
 * @route   POST /api/ai/chat
 * @desc    Send message to AI
 * @access  Public
 */
router.post('/chat',
    validateFields(['prompt'], ['model', 'systemMessage']),
    validateTypes({ prompt: 'string', model: 'string', systemMessage: 'string' }),
    chainGPTController.chat
);

/**
 * @route   POST /api/ai/analyze-contract
 * @desc    Analyze smart contract
 * @access  Public
 */
router.post('/analyze-contract',
    validateFields(['contractCode']),
    validateTypes({ contractCode: 'string' }),
    chainGPTController.analyzeContract
);

/**
 * @route   POST /api/ai/generate-contract
 * @desc    Generate smart contract
 * @access  Public
 */
router.post('/generate-contract',
    chainGPTController.generateContract
);

/**
 * @route   POST /api/ai/audit-contract
 * @desc    Audit smart contract
 * @access  Public
 */
router.post('/audit-contract',
    validateFields(['contractCode'], ['auditType']),
    validateTypes({ contractCode: 'string', auditType: 'string' }),
    chainGPTController.auditContract
);

/**
 * @route   POST /api/ai/explain-tx
 * @desc    Explain blockchain transaction
 * @access  Public
 */
router.post('/explain-tx',
    validateFields(['transactionData']),
    chainGPTController.explainTransaction
);

/**
 * @route   POST /api/ai/conversation
 * @desc    Multi-turn conversation
 * @access  Public
 */
router.post('/conversation',
    validateFields(['messages'], ['model']),
    validateTypes({ messages: 'array', model: 'string' }),
    chainGPTController.conversation
);

/**
 * @route   POST /api/ai/generate/erc20
 * @desc    Generate ERC20 token contract
 * @access  Public
 */
router.post('/generate/erc20',
    chainGPTController.generateERC20
);

/**
 * @route   POST /api/ai/generate/erc721
 * @desc    Generate ERC721 NFT contract
 * @access  Public
 */
router.post('/generate/erc721',
    chainGPTController.generateERC721
);

/**
 * @route   POST /api/ai/security-check
 * @desc    Perform security check on contract
 * @access  Public
 */
router.post('/security-check',
    validateFields(['contractCode']),
    validateTypes({ contractCode: 'string' }),
    chainGPTController.securityCheck
);

/**
 * @route   POST /api/ai/find-vulnerabilities
 * @desc    Find vulnerabilities in contract
 * @access  Public
 */
router.post('/find-vulnerabilities',
    validateFields(['contractCode']),
    validateTypes({ contractCode: 'string' }),
    chainGPTController.findVulnerabilities
);

/**
 * @route   POST /api/ai/cache/clear
 * @desc    Clear LLM response cache
 * @access  Public
 */
router.post('/cache/clear',
    chainGPTController.clearCache
);

module.exports = router;
