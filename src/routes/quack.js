const express = require('express');
const router = express.Router();
const quackQ402Service = require('../services/quack/Q402PaymentService');
const logger = require('../utils/logger');

/**
 * @route   POST /api/quack/payment/request
 * @desc    Create Quack Q402 payment request
 * @access  Public
 */
router.post('/payment/request', async (req, res) => {
    try {
        const { serviceType, agentId, metadata } = req.body;

        if (!serviceType || !agentId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: serviceType, agentId'
            });
        }

        const result = await quackQ402Service.createPaymentRequest(
            serviceType,
            agentId,
            metadata
        );

        res.json(result);
    } catch (error) {
        logger.error('Quack payment request error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/quack/payment/verify
 * @desc    Verify Quack Q402 payment
 * @access  Public
 */
router.post('/payment/verify', async (req, res) => {
    try {
        const { paymentId, txHash } = req.body;

        if (!paymentId || !txHash) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: paymentId, txHash'
            });
        }

        const result = await quackQ402Service.verifyPayment(paymentId, txHash);

        res.json(result);
    } catch (error) {
        logger.error('Quack payment verification error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/quack/payment/history
 * @desc    Get Quack Q402 payment history
 * @access  Public
 */
router.get('/payment/history', async (req, res) => {
    try {
        const { agentId } = req.query;

        if (!agentId) {
            // Return all payments if no agentId specified
            const allPayments = quackQ402Service.getAllPayments();
            return res.json({
                success: true,
                payments: allPayments,
                count: allPayments.length
            });
        }

        const history = quackQ402Service.getPaymentHistory(agentId);

        res.json({
            success: true,
            payments: history,
            count: history.length
        });
    } catch (error) {
        logger.error('Quack payment history error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/quack/pricing
 * @desc    Get Quack Q402 pricing information
 * @access  Public
 */
router.get('/pricing', async (req, res) => {
    try {
        const pricing = quackQ402Service.getPricing();

        res.json({
            success: true,
            ...pricing
        });
    } catch (error) {
        logger.error('Quack pricing error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/quack/execute
 * @desc    Initialize Unified Execution Layer (Sign-to-Pay)
 * @access  Public
 */
router.post('/execute', async (req, res) => {
    try {
        const { agentId, serviceType, params } = req.body;

        if (!agentId || !serviceType) {
            return res.status(400).json({
                success: false,
                error: 'Missing agentId or serviceType'
            });
        }

        const result = await quackQ402Service.unifiedExecute(agentId, serviceType, params);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/quack/process-receipt
 * @desc    Process Unified Execution receipt
 * @access  Public
 */
router.post('/process-receipt', async (req, res) => {
    try {
        const { executionId, signature, txHash } = req.body;

        if (!executionId || !signature || !txHash) {
            return res.status(400).json({
                success: false,
                error: 'Missing execution data'
            });
        }

        const result = await quackQ402Service.processUnifiedReceipt(executionId, signature, txHash);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
