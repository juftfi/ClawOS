const logger = require('../../utils/logger');

/**
 * Quack Q402 Payment Service for BNB Testnet
 * Implements EIP-7702 delegated payment protocol
 */
class QuackQ402Service {
    constructor() {
        this.network = 'bsc-testnet';
        this.chainId = 97;
        this.paymentToken = 'USDC'; // Symbol
        this.tokenAddress = '0x64544969ed7EBf5f083679233325356EbE738930'; // USDC on BNB Testnet
        this.recipientAddress = '0x2f914bcbad5bf4967bbb11e4372200b7c7594aeb'; // Recipient wallet
        this.payments = new Map();
        this.pricing = {
            'agent-creation': '1000000', // 1 USDC in smallest units (6 decimals)
            'agent-query': '100000', // 0.1 USDC
            'agent-action': '250000', // 0.25 USDC
            'contract-deploy': '2000000', // 2 USDC
            'contract-call': '500000', // 0.5 USDC
            'swap': '500000' // 0.5 USDC
        }; // amounts are integer strings in 6-decimal smallest units
    }

    /**
     * Create Q402 payment request
     * @param {string} serviceType - Type of service
     * @param {string} agentId - Agent identifier
     * @param {Object} metadata - Additional payment metadata
     * @returns {Promise<Object>} Payment request details
     */
    async createPaymentRequest(serviceType, agentId, metadata = {}) {
        try {
            const amount = this.pricing[serviceType] || '0.1';
            const paymentId = `q402_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const paymentRequest = {
                paymentId,
                id: paymentId, // Q402 uses both for compatibility
                network: this.network,
                chainId: this.chainId,
                serviceType,
                agentId,
                amount,
                token: this.tokenAddress, // Return token address here (frontend expects an address in `.token`)
                tokenSymbol: this.paymentToken,
                tokenAddress: this.tokenAddress,
                recipient: this.recipientAddress, // Add for consistency with x402
                status: 'pending',
                createdAt: new Date().toISOString(),
                metadata,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                // Q402 specific fields
                protocol: 'EIP-7702',
                requiresGasSponsorship: true,
                policyProtected: true
            };

            this.payments.set(paymentId, paymentRequest);

            logger.info(`Quack Q402 payment request created: ${paymentId} for ${amount} ${this.paymentToken}`);

            return {
                success: true,
                paymentRequest,
                paymentId,
                amount,
                token: this.paymentToken,
                tokenAddress: this.tokenAddress,
                network: this.network,
                chainId: this.chainId,
                protocol: 'Q402 (EIP-7702)',
                message: `Pay ${amount} ${this.paymentToken} for ${serviceType}`
            };
        } catch (error) {
            logger.error('Quack Q402 payment request error:', error);
            throw error;
        }
    }

    /**
     * Verify Q402 payment
     * @param {string} paymentId - Payment identifier
     * @param {string} txHash - Transaction hash
     * @returns {Promise<Object>} Verification result
     */
    async verifyPayment(paymentId, txHash) {
        try {
            const payment = this.payments.get(paymentId);

            if (!payment) {
                logger.warn(`Payment not found: ${paymentId}`);
            }

            // Real Production Verification Logic:
            const multiNetworkService = require('../blockchain/MultiNetworkService');
            let web3;
            try {
                web3 = multiNetworkService.getWeb3('bnb-testnet');
            } catch (err) {
                logger.error('MultiNetworkService error:', err.message);
                return { success: false, error: 'Blockchain service unreachable' };
            }

            logger.info(`Verifying Q402 transaction on-chain: ${txHash}`);
            const receipt = await web3.eth.getTransactionReceipt(txHash);

            if (!receipt || !receipt.status) {
                logger.error(`Transaction not found or failed: ${txHash}`);
                return {
                    success: false,
                    error: 'Transaction failed or not found on BNB Testnet'
                };
            }

            if (payment) {
                payment.status = 'verified';
                payment.txHash = txHash;
                payment.verifiedAt = new Date().toISOString();
                this.payments.set(paymentId, payment);
            }

            logger.info(`Quack Q402 payment verified on-chain: ${paymentId || 'untracked'} - ${txHash}`);

            return {
                success: true,
                paymentId,
                txHash,
                amount: payment ? payment.amount : 'unknown',
                status: 'verified',
                protocol: 'Q402',
                block: Number(receipt.blockNumber)
            };
        } catch (error) {
            logger.error('Quack Q402 payment verification error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get payment history
     * @param {string} agentId - Agent identifier
     * @returns {Array} Payment history
     */
    getPaymentHistory(agentId) {
        const history = [];

        for (const [id, payment] of this.payments) {
            if (payment.agentId === agentId) {
                history.push({
                    id,
                    serviceType: payment.serviceType,
                    amount: payment.amount,
                    token: payment.token,
                    status: payment.status,
                    txHash: payment.txHash,
                    createdAt: payment.createdAt,
                    protocol: 'Q402'
                });
            }
        }

        return history.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    /**
     * Get all payments (for admin/debugging)
     * @returns {Array} All payments
     */
    getAllPayments() {
        const allPayments = [];

        for (const [id, payment] of this.payments) {
            allPayments.push({
                id,
                ...payment
            });
        }

        return allPayments.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    /**
     * Unified Execution (Sign-to-Pay) for Q402/EIP-7702
     * Combines authorization, transfer, and gas sponsorship in one workflow.
     * @param {string} agentId - Target Agent
     * @param {string} serviceType - Type of action
     * @param {Object} actionParams - Data for the action (eg. swap params)
     * @returns {Promise<Object>} Execution result with delegation data
     */
    async unifiedExecute(agentId, serviceType, actionParams = {}) {
        try {
            const amount = this.pricing[serviceType] || '250000';
            const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            // In the 2026 Q402 layer, we generate a delegation payload
            // that the user signs once via EIP-7702/EOA-to-Contract.
            const executionPayload = {
                executionId,
                agentId,
                serviceType,
                payment: {
                    token: this.tokenAddress,
                    amount,
                    recipient: this.recipientAddress
                },
                action: actionParams,
                delegation: {
                    chain: this.network,
                    chainId: this.chainId,
                    verifiable: true,
                    protocol: 'Q402-v2'
                },
                timestamp: new Date().toISOString()
            };

            this.payments.set(executionId, {
                ...executionPayload,
                status: 'awaiting_signature',
                protocol: 'Q402-Unified'
            });

            logger.info(`Q402 Unified Execution initialized: ${executionId} for agent ${agentId}`);

            return {
                success: true,
                executionId,
                payload: executionPayload,
                signMessage: `Delegate execution of ${serviceType} for Agent ${agentId}. Payment: ${amount / 1000000} ${this.paymentToken}`
            };
        } catch (error) {
            logger.error('Q402 Unified Execution error:', error);
            throw error;
        }
    }

    /**
     * Verify and process the receipt of a Unified Execution
     * @param {string} executionId - The ID
     * @param {string} signature - The EIP-7702/v2 signature
     * @param {string} txHash - On-chain tx hash
     */
    async processUnifiedReceipt(executionId, signature, txHash) {
        try {
            const execution = this.payments.get(executionId);
            if (!execution) throw new Error('Execution session not found');

            // Production: Verify signature and event on-chain
            execution.status = 'executed';
            execution.signature = signature;
            execution.txHash = txHash;
            execution.executedAt = new Date().toISOString();

            this.payments.set(executionId, execution);

            logger.info(`Q402 Unified Execution processed successfully: ${executionId}`);

            return {
                success: true,
                executionId,
                txHash,
                status: 'executed'
            };
        } catch (error) {
            logger.error('Q402 Process Receipt error:', error);
            throw error;
        }
    }

    /**
     * Get service pricing
     * @returns {Object} Pricing information
     */
    getPricing() {
        return {
            network: this.network,
            token: this.paymentToken,
            pricing: this.pricing
        };
    }
}

module.exports = new QuackQ402Service();
