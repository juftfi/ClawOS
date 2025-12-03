const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validateAddress } = require('../middleware/validation');
const blockchainService = require('../services/blockchain/BlockchainService');
const transferService = require('../services/blockchain/TransferService');
const swapService = require('../services/blockchain/SwapService');
const deployService = require('../services/blockchain/ContractDeployService');
const contractCallService = require('../services/blockchain/ContractCallService');
const logger = require('../utils/logger');

/**
 * @route   GET /api/blockchain/balance/:address
 * @desc    Get wallet balance
 * @access  Public
 */
router.get('/balance/:address', asyncHandler(async (req, res) => {
    const { address } = req.params;

    const balance = await blockchainService.getBalance(address);

    res.json({
        success: true,
        data: balance,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/blockchain/transfer/prepare
 * @desc    Prepare transfer transaction
 * @access  Public
 */
router.post('/transfer/prepare', asyncHandler(async (req, res) => {
    const { from, to, amount, tokenAddress } = req.body;

    if (!from || !to || !amount) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: from, to, amount'
        });
    }

    const prepared = await transferService.prepareTransfer(from, to, amount, tokenAddress);

    res.json({
        success: true,
        data: prepared,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/blockchain/transfer/execute
 * @desc    Execute transfer transaction
 * @access  Public
 */
router.post('/transfer/execute', asyncHandler(async (req, res) => {
    const { from, to, amount, tokenAddress } = req.body;

    if (!from || !to || !amount) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: from, to, amount'
        });
    }

    const result = await transferService.executeTransfer(from, to, amount, tokenAddress);

    res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/blockchain/transfer/batch
 * @desc    Batch transfer to multiple recipients
 * @access  Public
 */
router.post('/transfer/batch', asyncHandler(async (req, res) => {
    const { from, recipients, tokenAddress } = req.body;

    if (!from || !recipients || !Array.isArray(recipients)) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: from, recipients (array)'
        });
    }

    const result = await transferService.batchTransfer(from, recipients, tokenAddress);

    res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/blockchain/gas-estimate
 * @desc    Estimate gas for transaction
 * @access  Public
 */
router.post('/gas-estimate', asyncHandler(async (req, res) => {
    const { transaction } = req.body;

    if (!transaction) {
        return res.status(400).json({
            success: false,
            error: 'Transaction object is required'
        });
    }

    const estimate = await blockchainService.estimateGas(transaction);

    res.json({
        success: true,
        data: estimate,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/blockchain/gas-price
 * @desc    Get current gas price
 * @access  Public
 */
router.get('/gas-price', asyncHandler(async (req, res) => {
    const gasPrice = await blockchainService.getGasPrice();

    res.json({
        success: true,
        data: gasPrice,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/blockchain/swap/prepare
 * @desc    Prepare swap transaction
 * @access  Public
 */
router.post('/swap/prepare', asyncHandler(async (req, res) => {
    const { fromToken, toToken, amount, slippage } = req.body;

    if (!fromToken || !toToken || !amount) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: fromToken, toToken, amount'
        });
    }

    const prepared = await swapService.prepareSwap(fromToken, toToken, amount, slippage);

    res.json({
        success: true,
        data: prepared,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/blockchain/swap/execute
 * @desc    Execute swap transaction
 * @access  Public
 */
router.post('/swap/execute', asyncHandler(async (req, res) => {
    const { fromToken, toToken, amount, slippage } = req.body;

    if (!fromToken || !toToken || !amount) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: fromToken, toToken, amount'
        });
    }

    const result = await swapService.executeSwap(fromToken, toToken, amount, slippage);

    res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/blockchain/swap/price
 * @desc    Get swap price quote
 * @access  Public
 */
router.post('/swap/price', asyncHandler(async (req, res) => {
    const { fromToken, toToken, amount } = req.body;

    if (!fromToken || !toToken || !amount) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: fromToken, toToken, amount'
        });
    }

    const price = await swapService.getSwapPrice(fromToken, toToken, amount);

    res.json({
        success: true,
        data: price,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/blockchain/deploy
 * @desc    Deploy smart contract
 * @access  Public
 */
router.post('/deploy', asyncHandler(async (req, res) => {
    const { bytecode, abi, constructorArgs, gasLimit } = req.body;

    if (!bytecode || !abi) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: bytecode, abi'
        });
    }

    const result = await deployService.deployContract(
        bytecode,
        abi,
        constructorArgs || [],
        gasLimit
    );

    res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/blockchain/deploy/verify/:address
 * @desc    Verify contract deployment
 * @access  Public
 */
router.get('/deploy/verify/:address', asyncHandler(async (req, res) => {
    const { address } = req.params;

    const verification = await deployService.verifyDeployment(address);

    res.json({
        success: true,
        data: verification,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/blockchain/deploy/estimate
 * @desc    Estimate deployment cost
 * @access  Public
 */
router.post('/deploy/estimate', asyncHandler(async (req, res) => {
    const { bytecode, abi, constructorArgs } = req.body;

    if (!bytecode || !abi) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: bytecode, abi'
        });
    }

    const estimate = await deployService.estimateDeploymentCost(
        bytecode,
        abi,
        constructorArgs || []
    );

    res.json({
        success: true,
        data: estimate,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/blockchain/contract/call
 * @desc    Call contract method (read-only)
 * @access  Public
 */
router.post('/contract/call', asyncHandler(async (req, res) => {
    const { contractAddress, methodName, params, abi } = req.body;

    if (!contractAddress || !methodName || !abi) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: contractAddress, methodName, abi'
        });
    }

    const result = await contractCallService.callContractMethod(
        contractAddress,
        methodName,
        params || [],
        abi
    );

    res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/blockchain/contract/write
 * @desc    Write to contract method (creates transaction)
 * @access  Public
 */
router.post('/contract/write', asyncHandler(async (req, res) => {
    const { contractAddress, methodName, params, abi, value } = req.body;

    if (!contractAddress || !methodName || !abi) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: contractAddress, methodName, abi'
        });
    }

    const result = await contractCallService.writeContractMethod(
        contractAddress,
        methodName,
        params || [],
        abi,
        value
    );

    res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/blockchain/contract/state
 * @desc    Get contract state
 * @access  Public
 */
router.post('/contract/state', asyncHandler(async (req, res) => {
    const { contractAddress, abi, methods } = req.body;

    if (!contractAddress || !abi) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: contractAddress, abi'
        });
    }

    const state = await contractCallService.getContractState(
        contractAddress,
        abi,
        methods || []
    );

    res.json({
        success: true,
        data: state,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/blockchain/contract/events
 * @desc    Get contract events
 * @access  Public
 */
router.post('/contract/events', asyncHandler(async (req, res) => {
    const { contractAddress, abi, eventName, fromBlock, toBlock } = req.body;

    if (!contractAddress || !abi) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: contractAddress, abi'
        });
    }

    const events = await contractCallService.getContractEvents(
        contractAddress,
        abi,
        eventName,
        fromBlock || 0,
        toBlock || 'latest'
    );

    res.json({
        success: true,
        data: events,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/blockchain/transaction/:hash
 * @desc    Get transaction details
 * @access  Public
 */
router.get('/transaction/:hash', asyncHandler(async (req, res) => {
    const { hash } = req.params;

    const transaction = await blockchainService.getTransaction(hash);

    res.json({
        success: true,
        data: transaction,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/blockchain/network
 * @desc    Get network information
 * @access  Public
 */
router.get('/network', asyncHandler(async (req, res) => {
    const networkInfo = await blockchainService.getNetworkInfo();

    res.json({
        success: true,
        data: networkInfo,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/blockchain/token/balance
 * @desc    Get token balance
 * @access  Public
 */
router.post('/token/balance', asyncHandler(async (req, res) => {
    const { tokenAddress, walletAddress } = req.body;

    if (!tokenAddress || !walletAddress) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: tokenAddress, walletAddress'
        });
    }

    const balance = await transferService.getTokenBalance(tokenAddress, walletAddress);

    res.json({
        success: true,
        data: balance,
        timestamp: new Date().toISOString()
    });
}));

module.exports = router;
