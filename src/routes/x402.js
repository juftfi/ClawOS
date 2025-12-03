const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/PaymentController');

/**
 * @route   POST /api/payment/session/init
 * @desc    Initialize payment session
 * @access  Public
 */
router.post('/session/init', paymentController.initializeSession);

/**
 * @route   POST /api/payment/prepare
 * @desc    Prepare payment request
 * @access  Public
 */
router.post('/prepare', paymentController.preparePayment);

/**
 * @route   POST /api/payment/preview
 * @desc    Get payment preview with costs and risks
 * @access  Public
 */
router.post('/preview', paymentController.getPaymentPreview);

/**
 * @route   POST /api/payment/verify-policy
 * @desc    Verify policy compliance
 * @access  Public
 */
router.post('/verify-policy', paymentController.verifyPolicy);

/**
 * @route   POST /api/payment/execute
 * @desc    Execute payment with x402 signature
 * @access  Public
 */
router.post('/execute', paymentController.executePayment);

/**
 * @route   GET /api/payment/history/:userId
 * @desc    Get payment history
 * @access  Public
 */
router.get('/history/:userId', paymentController.getPaymentHistory);

/**
 * @route   POST /api/policy/create
 * @desc    Create payment policy
 * @access  Public
 */
router.post('/policy/create', paymentController.createPolicy);

/**
 * @route   POST /api/policy/set-limit
 * @desc    Set spending limit
 * @access  Public
 */
router.post('/policy/set-limit', paymentController.setSpendingLimit);

/**
 * @route   POST /api/policy/allow-address
 * @desc    Add address to allowlist
 * @access  Public
 */
router.post('/policy/allow-address', paymentController.addAllowedAddress);

/**
 * @route   POST /api/policy/remove-allowed-address
 * @desc    Remove address from allowlist
 * @access  Public
 */
router.post('/policy/remove-allowed-address', paymentController.removeAllowedAddress);

/**
 * @route   POST /api/policy/deny-address
 * @desc    Add address to denylist
 * @access  Public
 */
router.post('/policy/deny-address', paymentController.addDeniedAddress);

/**
 * @route   GET /api/policy/summary/:userId
 * @desc    Get policy summary
 * @access  Public
 */
router.get('/policy/summary/:userId', paymentController.getPolicySummary);

/**
 * @route   POST /api/signature/generate
 * @desc    Generate x402 payment signature
 * @access  Public
 */
router.post('/signature/generate', paymentController.generateSignature);

/**
 * @route   POST /api/signature/verify
 * @desc    Verify x402 signature
 * @access  Public
 */
router.post('/signature/verify', paymentController.verifySignature);

/**
 * @route   POST /api/signature/multi-action
 * @desc    Create multi-action signature
 * @access  Public
 */
router.post('/signature/multi-action', paymentController.createMultiActionSignature);

/**
 * @route   POST /api/signature/contract-call
 * @desc    Sign contract call
 * @access  Public
 */
router.post('/signature/contract-call', paymentController.signContractCall);

module.exports = router;
