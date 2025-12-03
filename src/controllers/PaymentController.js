const paymentService = require('../services/x402/PaymentService');
const policyService = require('../services/x402/PolicyService');
const signatureService = require('../services/x402/SignatureService');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class PaymentController {
    /**
     * Initialize payment session
     */
    initializeSession = asyncHandler(async (req, res) => {
        const { userId, agentAction } = req.body;

        if (!userId || !agentAction) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, agentAction'
            });
        }

        const session = await paymentService.initializePaymentSession(userId, agentAction);

        res.json({
            success: true,
            data: session,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Prepare payment
     */
    preparePayment = asyncHandler(async (req, res) => {
        const { amount, recipient, metadata } = req.body;

        if (!amount || !recipient) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: amount, recipient'
            });
        }

        const prepared = await paymentService.preparePayment(amount, recipient, metadata || {});

        res.json({
            success: true,
            data: prepared,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Get payment preview
     */
    getPaymentPreview = asyncHandler(async (req, res) => {
        const { paymentDetails } = req.body;

        if (!paymentDetails) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: paymentDetails'
            });
        }

        const preview = await paymentService.getPaymentPreview(paymentDetails);

        res.json({
            success: true,
            data: preview,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Verify policy compliance
     */
    verifyPolicy = asyncHandler(async (req, res) => {
        const { paymentDetails, userId } = req.body;

        if (!paymentDetails || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: paymentDetails, userId'
            });
        }

        const compliance = await policyService.checkPolicyCompliance(paymentDetails, userId);

        res.json({
            success: true,
            data: compliance,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Execute payment
     */
    executePayment = asyncHandler(async (req, res) => {
        const { x402Signature, paymentDetails } = req.body;

        if (!x402Signature || !paymentDetails) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: x402Signature, paymentDetails'
            });
        }

        const result = await paymentService.executePayment(x402Signature, paymentDetails);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Get payment history
     */
    getPaymentHistory = asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const { limit = 50 } = req.query;

        const history = await paymentService.getPaymentHistory(userId, parseInt(limit));

        res.json({
            success: true,
            data: {
                user_id: userId,
                payment_count: history.length,
                payments: history
            },
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Create payment policy
     */
    createPolicy = asyncHandler(async (req, res) => {
        const { userId, rules } = req.body;

        if (!userId || !rules) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, rules'
            });
        }

        const policy = await paymentService.createPaymentPolicy(userId, rules);

        res.json({
            success: true,
            data: policy,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Set spending limit
     */
    setSpendingLimit = asyncHandler(async (req, res) => {
        const { userId, limitBNB } = req.body;

        if (!userId || !limitBNB) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, limitBNB'
            });
        }

        const result = await policyService.setSpendingLimit(userId, limitBNB);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Add allowed address
     */
    addAllowedAddress = asyncHandler(async (req, res) => {
        const { userId, address } = req.body;

        if (!userId || !address) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, address'
            });
        }

        const policy = await policyService.getPolicy(userId);
        const allowedAddresses = policy.allowed_addresses || [];

        if (!allowedAddresses.includes(address.toLowerCase())) {
            allowedAddresses.push(address.toLowerCase());
        }

        const result = await policyService.setAllowedAddresses(userId, allowedAddresses);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Remove allowed address
     */
    removeAllowedAddress = asyncHandler(async (req, res) => {
        const { userId, address } = req.body;

        if (!userId || !address) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, address'
            });
        }

        const policy = await policyService.getPolicy(userId);
        const allowedAddresses = (policy.allowed_addresses || [])
            .filter(addr => addr.toLowerCase() !== address.toLowerCase());

        const result = await policyService.setAllowedAddresses(userId, allowedAddresses);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Add denied address
     */
    addDeniedAddress = asyncHandler(async (req, res) => {
        const { userId, address } = req.body;

        if (!userId || !address) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, address'
            });
        }

        const policy = await policyService.getPolicy(userId);
        const deniedAddresses = policy.denied_addresses || [];

        if (!deniedAddresses.includes(address.toLowerCase())) {
            deniedAddresses.push(address.toLowerCase());
        }

        const result = await policyService.setDeniedAddresses(userId, deniedAddresses);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Get policy summary
     */
    getPolicySummary = asyncHandler(async (req, res) => {
        const { userId } = req.params;

        const summary = await policyService.getPolicySummary(userId);

        res.json({
            success: true,
            data: summary,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Generate payment signature
     */
    generateSignature = asyncHandler(async (req, res) => {
        const { paymentDetails } = req.body;

        if (!paymentDetails) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: paymentDetails'
            });
        }

        const signature = await signatureService.generatePaymentSignature(paymentDetails);

        res.json({
            success: true,
            data: signature,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Verify signature
     */
    verifySignature = asyncHandler(async (req, res) => {
        const { signature, paymentDetails } = req.body;

        if (!signature || !paymentDetails) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: signature, paymentDetails'
            });
        }

        const isValid = await signatureService.verifySignature(signature, paymentDetails);

        res.json({
            success: true,
            data: {
                valid: isValid,
                signature,
                payment_details: paymentDetails
            },
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Create multi-action signature
     */
    createMultiActionSignature = asyncHandler(async (req, res) => {
        const { actions } = req.body;

        if (!actions || !Array.isArray(actions)) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: actions (array)'
            });
        }

        const signature = await signatureService.createSingleTxSignature(actions);

        res.json({
            success: true,
            data: signature,
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Sign contract call
     */
    signContractCall = asyncHandler(async (req, res) => {
        const { contractAddress, method, params } = req.body;

        if (!contractAddress || !method) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: contractAddress, method'
            });
        }

        const signature = await signatureService.signContractCall(
            contractAddress,
            method,
            params || []
        );

        res.json({
            success: true,
            data: signature,
            timestamp: new Date().toISOString()
        });
    });
}

module.exports = new PaymentController();
