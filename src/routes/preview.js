const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const previewService = require('../services/preview/PreviewService');
const riskAssessmentService = require('../services/risk/RiskAssessmentService');
const blockchainService = require('../services/blockchain/BlockchainService');
const logger = require('../utils/logger');

/**
 * @route   POST /api/preview/transaction
 * @desc    Generate transaction preview
 * @access  Public
 */
router.post('/transaction', asyncHandler(async (req, res) => {
    const { transaction } = req.body;

    if (!transaction) {
        return res.status(400).json({
            success: false,
            error: 'Missing required field: transaction'
        });
    }

    const preview = await previewService.generatePreview(transaction);

    res.json({
        success: true,
        data: preview,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/preview/risks/:txHash
 * @desc    Analyze past transaction risks
 * @access  Public
 */
router.get('/risks/:txHash', asyncHandler(async (req, res) => {
    const { txHash } = req.params;

    // Get transaction details
    const transaction = await blockchainService.getTransaction(txHash);

    // Assess risks
    const assessment = await riskAssessmentService.assessTransaction({
        from: transaction.from,
        recipient: transaction.to,
        amount: transaction.value,
        gas_estimate: {
            gas_limit: transaction.gas,
            gas_price_gwei: blockchainService.getWeb3().utils.fromWei(
                transaction.gas_price || '0',
                'gwei'
            )
        }
    });

    res.json({
        success: true,
        data: {
            tx_hash: txHash,
            transaction,
            risk_assessment: assessment
        },
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/preview/gas-prices
 * @desc    Get current gas price information
 * @access  Public
 */
router.get('/gas-prices', asyncHandler(async (req, res) => {
    const gasPrice = await blockchainService.getGasPrice();
    const averageGasPrice = await riskAssessmentService.getAverageGasPrice();

    const web3 = blockchainService.getWeb3();

    // Calculate gas costs for common operations
    const operations = {
        transfer: 21000,
        swap: 150000,
        contract_call: 100000,
        deploy: 500000
    };

    const costs = {};
    for (const [op, gasLimit] of Object.entries(operations)) {
        const costWei = BigInt(gasLimit) * BigInt(gasPrice.wei);
        const costBNB = web3.utils.fromWei(costWei.toString(), 'ether');
        costs[op] = {
            gas_limit: gasLimit,
            cost_bnb: costBNB,
            cost_usd: previewService.formatUSD(parseFloat(costBNB))
        };
    }

    // Record gas price for historical tracking
    riskAssessmentService.recordGasPrice(parseFloat(gasPrice.gwei));

    res.json({
        success: true,
        data: {
            current: {
                wei: gasPrice.wei,
                gwei: gasPrice.gwei,
                formatted: gasPrice.formatted
            },
            average_gwei: averageGasPrice.toFixed(2),
            comparison: {
                vs_average: ((parseFloat(gasPrice.gwei) / averageGasPrice - 1) * 100).toFixed(1) + '%',
                is_high: parseFloat(gasPrice.gwei) > averageGasPrice * 1.2,
                is_low: parseFloat(gasPrice.gwei) < averageGasPrice * 0.8
            },
            estimated_costs: costs,
            recommendation: this.getGasRecommendation(parseFloat(gasPrice.gwei), averageGasPrice)
        },
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/preview/simulate
 * @desc    Simulate transaction execution
 * @access  Public
 */
router.post('/simulate', asyncHandler(async (req, res) => {
    const { transaction } = req.body;

    if (!transaction) {
        return res.status(400).json({
            success: false,
            error: 'Missing required field: transaction'
        });
    }

    // Generate preview
    const preview = await previewService.generatePreview(transaction);

    // Simulate execution (without actually executing)
    const simulation = {
        will_succeed: preview.can_execute,
        estimated_gas: preview.costs.gas_limit,
        estimated_cost: preview.costs.total_cost_bnb,
        risk_level: preview.risk_level,
        warnings: preview.warnings,
        recommendations: preview.recommendations
    };

    // Check balance
    if (transaction.from) {
        const balance = await blockchainService.getBalance(transaction.from);
        const web3 = blockchainService.getWeb3();
        const totalNeeded = web3.utils.toWei(preview.costs.total_cost_bnb, 'ether');

        simulation.balance_check = {
            current_balance: balance.balance_bnb,
            required: preview.costs.total_cost_bnb,
            sufficient: BigInt(balance.balance_wei) >= BigInt(totalNeeded),
            remaining_after: (parseFloat(balance.balance_bnb) - parseFloat(preview.costs.total_cost_bnb)).toFixed(6)
        };
    }

    res.json({
        success: true,
        data: {
            preview,
            simulation
        },
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/preview/compare
 * @desc    Compare transaction with historical data
 * @access  Public
 */
router.post('/compare', asyncHandler(async (req, res) => {
    const { transaction, userId } = req.body;

    if (!transaction) {
        return res.status(400).json({
            success: false,
            error: 'Missing required field: transaction'
        });
    }

    const comparison = await previewService.getHistoricalComparison(
        transaction.action,
        userId
    );

    const chartData = previewService.generateComparisonChart(transaction, comparison);

    res.json({
        success: true,
        data: {
            transaction,
            historical_comparison: comparison,
            chart_data: chartData
        },
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/preview/batch
 * @desc    Preview multiple transactions
 * @access  Public
 */
router.post('/batch', asyncHandler(async (req, res) => {
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
        return res.status(400).json({
            success: false,
            error: 'Missing required field: transactions (array)'
        });
    }

    const previews = [];
    let totalCost = 0;
    let highestRisk = 'LOW';

    for (const tx of transactions) {
        const preview = await previewService.generatePreview(tx);
        previews.push(preview);

        totalCost += parseFloat(preview.costs.total_cost_bnb);

        if (this.compareRiskLevels(preview.risk_level, highestRisk) > 0) {
            highestRisk = preview.risk_level;
        }
    }

    res.json({
        success: true,
        data: {
            transaction_count: transactions.length,
            previews,
            batch_summary: {
                total_cost_bnb: totalCost.toFixed(6),
                total_cost_usd: previewService.formatUSD(totalCost),
                highest_risk_level: highestRisk,
                can_execute_all: previews.every(p => p.can_execute)
            }
        },
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   GET /api/preview/bnb-price
 * @desc    Get current BNB price
 * @access  Public
 */
router.get('/bnb-price', asyncHandler(async (req, res) => {
    const price = previewService.getBNBPrice();

    res.json({
        success: true,
        data: {
            bnb_usd: price,
            last_updated: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
    });
}));

/**
 * @route   POST /api/preview/bnb-price
 * @desc    Update BNB price
 * @access  Public
 */
router.post('/bnb-price', asyncHandler(async (req, res) => {
    const { price } = req.body;

    if (!price || isNaN(price)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid price value'
        });
    }

    previewService.updateBNBPrice(parseFloat(price));

    res.json({
        success: true,
        data: {
            bnb_usd: parseFloat(price),
            updated_at: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
    });
}));

/**
 * Helper: Get gas recommendation
 */
function getGasRecommendation(currentGwei, averageGwei) {
    if (currentGwei > averageGwei * 1.5) {
        return 'High gas prices - consider waiting';
    } else if (currentGwei < averageGwei * 0.8) {
        return 'Low gas prices - good time to transact';
    } else {
        return 'Normal gas prices';
    }
}

/**
 * Helper: Compare risk levels
 */
function compareRiskLevels(level1, level2) {
    const levels = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
    return levels[level1] - levels[level2];
}

module.exports = router;
