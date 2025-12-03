const signatureService = require('./SignatureService');
const policyService = require('./PolicyService');
const membaseService = require('../memory/MembaseService');
const blockchainService = require('../blockchain/BlockchainService');
const logger = require('../../utils/logger');

class PaymentService {
    constructor() {
        this.activeSessions = new Map();
        this.paymentNonces = new Map();
    }

    /**
     * Initialize payment session
     * @param {string} userId - User identifier
     * @param {string} agentAction - Action being performed
     * @returns {Promise<Object>} Session info
     */
    async initializePaymentSession(userId, agentAction) {
        try {
            const sessionId = this.generateSessionId();
            const session = {
                session_id: sessionId,
                user_id: userId,
                agent_action: agentAction,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
                status: 'active',
                nonce: this.getNextNonce(userId)
            };

            this.activeSessions.set(sessionId, session);

            logger.info('Payment session initialized', { sessionId, userId, agentAction });

            return {
                success: true,
                session_id: sessionId,
                user_id: userId,
                agent_action: agentAction,
                nonce: session.nonce,
                expires_at: session.expires_at
            };
        } catch (error) {
            logger.error('Initialize payment session error:', error.message);
            throw new Error(`Failed to initialize payment session: ${error.message}`);
        }
    }

    /**
     * Prepare payment
     * @param {string} amount - Amount in BNB
     * @param {string} recipient - Recipient address
     * @param {Object} metadata - Additional metadata
     * @returns {Promise<Object>} Payment object
     */
    async preparePayment(amount, recipient, metadata = {}) {
        try {
            const userId = metadata.user_id;
            const agentAddress = metadata.agent_address || process.env.BNB_WALLET_ADDRESS;

            if (!blockchainService.validateAddress(recipient)) {
                throw new Error('Invalid recipient address format');
            }

            // Check policy compliance
            const payment = {
                user: userId,
                agent: agentAddress,
                action: metadata.action || 'transfer',
                amount,
                recipient,
                token: metadata.token || null,
                nonce: this.getNextNonce(userId),
                timestamp: Math.floor(Date.now() / 1000),
                expires: Math.floor(Date.now() / 1000) + 3600, // 1 hour
                metadata
            };

            const compliance = await policyService.checkPolicyCompliance(payment, userId);

            if (!compliance.compliant) {
                throw new Error(`Policy violation: ${compliance.violations.join(', ')}`);
            }

            // Estimate gas
            const web3 = blockchainService.getWeb3();
            const amountWei = web3.utils.toWei(amount, 'ether');

            const gasEstimate = await blockchainService.estimateGas({
                from: agentAddress,
                to: recipient,
                value: amountWei
            });

            logger.info('Payment prepared', { userId, amount, recipient });

            return {
                success: true,
                payment,
                gas_estimate: gasEstimate,
                policy_compliant: true,
                requires_signature: true
            };
        } catch (error) {
            logger.error('Prepare payment error:', error.message);
            throw new Error(`Failed to prepare payment: ${error.message}`);
        }
    }

    /**
     * Create payment policy
     * @param {string} userId - User identifier
     * @param {Object} rules - Policy rules
     * @returns {Promise<Object>} Policy creation result
     */
    async createPaymentPolicy(userId, rules) {
        try {
            const policy = {
                user_id: userId,
                max_daily_spend: rules.max_daily_spend || '1000000000000000000', // 1 BNB default
                max_single_tx: rules.max_single_tx || '100000000000000000', // 0.1 BNB default
                daily_tx_limit: rules.daily_tx_limit || 100,
                allowed_addresses: rules.allowed_addresses || [],
                denied_addresses: rules.denied_addresses || [],
                allowed_actions: rules.allowed_actions || ['transfer', 'swap', 'call'],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            await policyService.storePolicy(userId, policy);

            logger.info('Payment policy created', { userId });

            return {
                success: true,
                user_id: userId,
                policy
            };
        } catch (error) {
            logger.error('Create payment policy error:', error.message);
            throw new Error(`Failed to create payment policy: ${error.message}`);
        }
    }

    /**
     * Verify payment with x402 signature
     * @param {string} x402Signature - x402 signature
     * @param {Object} paymentDetails - Payment details
     * @returns {Promise<Object>} Verification result
     */
    async verifyPayment(x402Signature, paymentDetails) {
        try {
            // Verify signature
            const signatureValid = await signatureService.verifySignature(
                x402Signature,
                paymentDetails
            );

            if (!signatureValid) {
                throw new Error('Signature verification failed');
            }

            // Check expiration
            const now = Math.floor(Date.now() / 1000);
            if (paymentDetails.expires < now) {
                throw new Error('Payment approval expired');
            }

            // Check policy compliance
            const compliance = await policyService.checkPolicyCompliance(
                paymentDetails,
                paymentDetails.user
            );

            if (!compliance.compliant) {
                throw new Error(`Policy violation: ${compliance.violations.join(', ')}`);
            }

            logger.info('Payment verified', { user: paymentDetails.user });

            return {
                success: true,
                verified: true,
                signature_valid: true,
                policy_compliant: true,
                payment_details: paymentDetails
            };
        } catch (error) {
            logger.error('Verify payment error:', error.message);
            return {
                success: false,
                verified: false,
                error: error.message
            };
        }
    }

    /**
     * Execute payment with x402 signature
     * @param {string} x402Signature - x402 signature
     * @param {Object} paymentDetails - Payment details
     * @returns {Promise<Object>} Execution result
     */
    async executePayment(x402Signature, paymentDetails) {
        try {
            // Verify payment first
            const verification = await this.verifyPayment(x402Signature, paymentDetails);

            if (!verification.verified) {
                throw new Error(verification.error || 'Payment verification failed');
            }

            // Execute the payment based on action
            let result;
            const web3 = blockchainService.getWeb3();
            const account = blockchainService.getAccount();

            switch (paymentDetails.action) {
                case 'transfer':
                    const transferService = require('../blockchain/TransferService');
                    result = await transferService.executeTransfer(
                        account.address,
                        paymentDetails.recipient,
                        paymentDetails.amount,
                        paymentDetails.token
                    );
                    break;

                case 'swap':
                    const swapService = require('../blockchain/SwapService');
                    result = await swapService.executeSwap(
                        paymentDetails.from_token || 'BNB',
                        paymentDetails.to_token,
                        paymentDetails.amount,
                        paymentDetails.slippage || 0.5
                    );
                    break;

                case 'call':
                    const contractCallService = require('../blockchain/ContractCallService');
                    result = await contractCallService.writeContractMethod(
                        paymentDetails.contract_address,
                        paymentDetails.method,
                        paymentDetails.params || [],
                        paymentDetails.abi,
                        paymentDetails.value || '0'
                    );
                    break;

                default:
                    throw new Error(`Unsupported action: ${paymentDetails.action}`);
            }

            // Store payment in history
            await this.storePaymentHistory(paymentDetails, result);

            // Update policy tracking
            await policyService.recordPayment(paymentDetails.user, paymentDetails);

            logger.info('Payment executed', {
                user: paymentDetails.user,
                txHash: result.tx_hash
            });

            return {
                success: true,
                executed: true,
                tx_hash: result.tx_hash,
                status: result.status,
                gas_used: result.gas_used,
                payment_details: paymentDetails,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Execute payment error:', error.message);
            throw new Error(`Failed to execute payment: ${error.message}`);
        }
    }

    /**
     * Get payment history
     * @param {string} userId - User identifier
     * @param {number} limit - Number of payments to retrieve
     * @returns {Promise<Array>} Payment history
     */
    async getPaymentHistory(userId, limit = 50) {
        try {
            const history = await membaseService.queryMemory(
                'payments',
                { user_id: userId },
                limit
            );

            // Sort by timestamp descending
            const sorted = history.sort((a, b) =>
                new Date(b.timestamp) - new Date(a.timestamp)
            );

            logger.info('Payment history retrieved', { userId, count: sorted.length });

            return sorted.slice(0, limit);
        } catch (error) {
            logger.error('Get payment history error:', error.message);
            return [];
        }
    }

    /**
     * Store payment in history
     * @param {Object} paymentDetails - Payment details
     * @param {Object} result - Execution result
     * @returns {Promise<void>}
     */
    async storePaymentHistory(paymentDetails, result) {
        try {
            const payment = {
                user_id: paymentDetails.user,
                action: paymentDetails.action,
                amount: paymentDetails.amount,
                recipient: paymentDetails.recipient,
                tx_hash: result.tx_hash,
                status: result.status,
                gas_used: result.gas_used,
                timestamp: new Date().toISOString(),
                payment_details: paymentDetails,
                result
            };

            await membaseService.store('payments', payment);

            logger.info('Payment stored in history', { txHash: result.tx_hash });
        } catch (error) {
            logger.error('Store payment history error:', error.message);
        }
    }

    /**
     * Get payment preview
     * @param {Object} paymentDetails - Payment details
     * @returns {Promise<Object>} Payment preview
     */
    async getPaymentPreview(paymentDetails) {
        try {
            const web3 = blockchainService.getWeb3();
            const amountWei = web3.utils.toWei(paymentDetails.amount, 'ether');

            // Get gas estimate
            const gasEstimate = await blockchainService.estimateGas({
                from: paymentDetails.agent,
                to: paymentDetails.recipient,
                value: amountWei
            });

            // Check policy
            const compliance = await policyService.checkPolicyCompliance(
                paymentDetails,
                paymentDetails.user
            );

            // Calculate total cost
            const totalCostWei = BigInt(amountWei) + BigInt(gasEstimate.estimated_cost_wei);
            const totalCostBNB = web3.utils.fromWei(totalCostWei.toString(), 'ether');

            // Risk assessment
            const riskLevel = this.assessRisk(paymentDetails, compliance);

            return {
                payment: {
                    action: paymentDetails.action,
                    amount: paymentDetails.amount,
                    recipient: paymentDetails.recipient,
                    token: paymentDetails.token || 'BNB'
                },
                costs: {
                    amount_bnb: paymentDetails.amount,
                    gas_cost_bnb: gasEstimate.estimated_cost_bnb,
                    total_cost_bnb: totalCostBNB,
                    gas_limit: gasEstimate.gas_limit,
                    gas_price_gwei: gasEstimate.gas_price_gwei
                },
                policy: {
                    compliant: compliance.compliant,
                    violations: compliance.violations,
                    warnings: compliance.warnings || []
                },
                risk: riskLevel,
                expires_at: new Date(paymentDetails.expires * 1000).toISOString()
            };
        } catch (error) {
            logger.error('Get payment preview error:', error.message);
            throw new Error(`Failed to get payment preview: ${error.message}`);
        }
    }

    /**
     * Assess payment risk
     * @param {Object} paymentDetails - Payment details
     * @param {Object} compliance - Policy compliance
     * @returns {Object} Risk assessment
     */
    assessRisk(paymentDetails, compliance) {
        let riskScore = 0;
        const warnings = [];

        // Check amount
        const web3 = blockchainService.getWeb3();
        const amountWei = BigInt(web3.utils.toWei(paymentDetails.amount, 'ether'));
        const highAmountThreshold = BigInt(web3.utils.toWei('0.5', 'ether'));

        if (amountWei > highAmountThreshold) {
            riskScore += 3;
            warnings.push('High transaction amount');
        }

        // Check policy violations
        if (!compliance.compliant) {
            riskScore += 5;
            warnings.push('Policy violations detected');
        }

        // Check recipient
        if (!blockchainService.validateAddress(paymentDetails.recipient)) {
            riskScore += 5;
            warnings.push('Invalid recipient address');
        }

        // Determine risk level
        let level = 'low';
        if (riskScore >= 7) {
            level = 'high';
        } else if (riskScore >= 4) {
            level = 'medium';
        }

        return {
            level,
            score: riskScore,
            warnings
        };
    }

    /**
     * Get next nonce for user
     * @param {string} userId - User identifier
     * @returns {number} Next nonce
     */
    getNextNonce(userId) {
        const current = this.paymentNonces.get(userId) || 0;
        const next = current + 1;
        this.paymentNonces.set(userId, next);
        return next;
    }

    /**
     * Generate session ID
     * @returns {string} Session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get active session
     * @param {string} sessionId - Session ID
     * @returns {Object|null} Session info
     */
    getSession(sessionId) {
        return this.activeSessions.get(sessionId) || null;
    }

    /**
     * End session
     * @param {string} sessionId - Session ID
     * @returns {boolean} Success
     */
    endSession(sessionId) {
        return this.activeSessions.delete(sessionId);
    }
}

module.exports = new PaymentService();
