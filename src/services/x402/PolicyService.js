const membaseService = require('../memory/MembaseService');
const blockchainService = require('../blockchain/BlockchainService');
const logger = require('../../utils/logger');

class PolicyService {
    constructor() {
        this.policies = new Map(); // In-memory cache
        this.dailyTracking = new Map(); // Track daily spending
    }

    /**
     * Store policy
     * @param {string} userId - User identifier
     * @param {Object} policy - Policy rules
     * @returns {Promise<Object>} Storage result
     */
    async storePolicy(userId, policy) {
        try {
            await membaseService.storeUserPreference(userId, 'payment_policy', policy);
            this.policies.set(userId, policy);

            logger.info('Policy stored', { userId });

            return {
                success: true,
                user_id: userId,
                policy
            };
        } catch (error) {
            logger.error('Store policy error:', error.message);
            throw new Error(`Failed to store policy: ${error.message}`);
        }
    }

    /**
     * Get policy
     * @param {string} userId - User identifier
     * @returns {Promise<Object>} Policy rules
     */
    async getPolicy(userId) {
        try {
            // Check cache first
            if (this.policies.has(userId)) {
                return this.policies.get(userId);
            }

            // Fetch from storage
            const preferences = await membaseService.getUserPreferences(userId);
            const policy = preferences.payment_policy || this.getDefaultPolicy();

            this.policies.set(userId, policy);

            return policy;
        } catch (error) {
            logger.error('Get policy error:', error.message);
            return this.getDefaultPolicy();
        }
    }

    /**
     * Set spending limit
     * @param {string} userId - User identifier
     * @param {string} limitBNB - Limit in BNB
     * @returns {Promise<Object>} Update result
     */
    async setSpendingLimit(userId, limitBNB) {
        try {
            const policy = await this.getPolicy(userId);
            const web3 = blockchainService.getWeb3();

            policy.max_daily_spend = web3.utils.toWei(limitBNB, 'ether');
            policy.updated_at = new Date().toISOString();

            await this.storePolicy(userId, policy);

            logger.info('Spending limit set', { userId, limitBNB });

            return {
                success: true,
                user_id: userId,
                max_daily_spend_bnb: limitBNB,
                max_daily_spend_wei: policy.max_daily_spend
            };
        } catch (error) {
            logger.error('Set spending limit error:', error.message);
            throw new Error(`Failed to set spending limit: ${error.message}`);
        }
    }

    /**
     * Set allowed addresses
     * @param {string} userId - User identifier
     * @param {Array} addresses - Allowed addresses
     * @returns {Promise<Object>} Update result
     */
    async setAllowedAddresses(userId, addresses) {
        try {
            // Validate addresses
            for (const addr of addresses) {
                if (!blockchainService.validateAddress(addr)) {
                    throw new Error(`Invalid address: ${addr}`);
                }
            }

            const policy = await this.getPolicy(userId);
            policy.allowed_addresses = addresses.map(a => a.toLowerCase());
            policy.updated_at = new Date().toISOString();

            await this.storePolicy(userId, policy);

            logger.info('Allowed addresses set', { userId, count: addresses.length });

            return {
                success: true,
                user_id: userId,
                allowed_addresses: policy.allowed_addresses
            };
        } catch (error) {
            logger.error('Set allowed addresses error:', error.message);
            throw new Error(`Failed to set allowed addresses: ${error.message}`);
        }
    }

    /**
     * Set denied addresses
     * @param {string} userId - User identifier
     * @param {Array} addresses - Denied addresses
     * @returns {Promise<Object>} Update result
     */
    async setDeniedAddresses(userId, addresses) {
        try {
            // Validate addresses
            for (const addr of addresses) {
                if (!blockchainService.validateAddress(addr)) {
                    throw new Error(`Invalid address: ${addr}`);
                }
            }

            const policy = await this.getPolicy(userId);
            policy.denied_addresses = addresses.map(a => a.toLowerCase());
            policy.updated_at = new Date().toISOString();

            await this.storePolicy(userId, policy);

            logger.info('Denied addresses set', { userId, count: addresses.length });

            return {
                success: true,
                user_id: userId,
                denied_addresses: policy.denied_addresses
            };
        } catch (error) {
            logger.error('Set denied addresses error:', error.message);
            throw new Error(`Failed to set denied addresses: ${error.message}`);
        }
    }

    /**
     * Check policy compliance
     * @param {Object} payment - Payment details
     * @param {string} userId - User identifier
     * @returns {Promise<Object>} Compliance result
     */
    async checkPolicyCompliance(payment, userId) {
        try {
            const policy = await this.getPolicy(userId);
            const violations = [];
            const warnings = [];

            const web3 = blockchainService.getWeb3();
            const amountWei = BigInt(web3.utils.toWei(payment.amount, 'ether'));

            // Check single transaction limit
            if (policy.max_single_tx) {
                const maxSingleTx = BigInt(policy.max_single_tx);
                if (amountWei > maxSingleTx) {
                    violations.push(`Amount exceeds single transaction limit of ${web3.utils.fromWei(policy.max_single_tx, 'ether')} BNB`);
                }
            }

            // Check daily spending limit
            const dailySpent = await this.getDailySpending(userId);
            const dailySpentWei = BigInt(dailySpent);
            const totalDailyWei = dailySpentWei + amountWei;

            if (policy.max_daily_spend) {
                const maxDailySpend = BigInt(policy.max_daily_spend);
                if (totalDailyWei > maxDailySpend) {
                    violations.push(`Would exceed daily spending limit of ${web3.utils.fromWei(policy.max_daily_spend, 'ether')} BNB`);
                } else if (totalDailyWei > maxDailySpend * BigInt(80) / BigInt(100)) {
                    warnings.push(`Approaching daily spending limit (${Math.floor(Number(totalDailyWei * BigInt(100) / maxDailySpend))}% used)`);
                }
            }

            // Check daily transaction limit
            const dailyTxCount = await this.getDailyTransactionCount(userId);
            if (policy.daily_tx_limit && dailyTxCount >= policy.daily_tx_limit) {
                violations.push(`Daily transaction limit of ${policy.daily_tx_limit} reached`);
            }

            // Check allowed addresses
            if (policy.allowed_addresses && policy.allowed_addresses.length > 0) {
                const recipientLower = payment.recipient.toLowerCase();
                if (!policy.allowed_addresses.includes(recipientLower)) {
                    violations.push('Recipient not in allowlist');
                }
            }

            // Check denied addresses
            if (policy.denied_addresses && policy.denied_addresses.length > 0) {
                const recipientLower = payment.recipient.toLowerCase();
                if (policy.denied_addresses.includes(recipientLower)) {
                    violations.push('Recipient is in denylist');
                }
            }

            // Check allowed actions
            if (policy.allowed_actions && policy.allowed_actions.length > 0) {
                if (!policy.allowed_actions.includes(payment.action)) {
                    violations.push(`Action '${payment.action}' not allowed`);
                }
            }

            const compliant = violations.length === 0;

            logger.info('Policy compliance checked', {
                userId,
                compliant,
                violations: violations.length
            });

            return {
                compliant,
                violations,
                warnings,
                policy
            };
        } catch (error) {
            logger.error('Check policy compliance error:', error.message);
            return {
                compliant: false,
                violations: [`Policy check failed: ${error.message}`],
                warnings: []
            };
        }
    }

    /**
     * Get policy violations
     * @param {Object} payment - Payment details
     * @param {string} userId - User identifier
     * @returns {Promise<Array>} List of violations
     */
    async getPolicyViolations(payment, userId) {
        try {
            const compliance = await this.checkPolicyCompliance(payment, userId);
            return compliance.violations;
        } catch (error) {
            logger.error('Get policy violations error:', error.message);
            return [`Error checking violations: ${error.message}`];
        }
    }

    /**
     * Record payment for tracking
     * @param {string} userId - User identifier
     * @param {Object} payment - Payment details
     * @returns {Promise<void>}
     */
    async recordPayment(userId, payment) {
        try {
            const today = this.getTodayKey();
            const trackingKey = `${userId}:${today}`;

            let tracking = this.dailyTracking.get(trackingKey) || {
                spent_wei: '0',
                tx_count: 0,
                payments: []
            };

            const web3 = blockchainService.getWeb3();
            const amountWei = web3.utils.toWei(payment.amount, 'ether');

            tracking.spent_wei = (BigInt(tracking.spent_wei) + BigInt(amountWei)).toString();
            tracking.tx_count += 1;
            tracking.payments.push({
                amount: payment.amount,
                recipient: payment.recipient,
                action: payment.action,
                timestamp: new Date().toISOString()
            });

            this.dailyTracking.set(trackingKey, tracking);

            logger.info('Payment recorded', { userId, txCount: tracking.tx_count });
        } catch (error) {
            logger.error('Record payment error:', error.message);
        }
    }

    /**
     * Get daily spending
     * @param {string} userId - User identifier
     * @returns {Promise<string>} Spent amount in Wei
     */
    async getDailySpending(userId) {
        try {
            const today = this.getTodayKey();
            const trackingKey = `${userId}:${today}`;

            const tracking = this.dailyTracking.get(trackingKey);
            return tracking ? tracking.spent_wei : '0';
        } catch (error) {
            logger.error('Get daily spending error:', error.message);
            return '0';
        }
    }

    /**
     * Get daily transaction count
     * @param {string} userId - User identifier
     * @returns {Promise<number>} Transaction count
     */
    async getDailyTransactionCount(userId) {
        try {
            const today = this.getTodayKey();
            const trackingKey = `${userId}:${today}`;

            const tracking = this.dailyTracking.get(trackingKey);
            return tracking ? tracking.tx_count : 0;
        } catch (error) {
            logger.error('Get daily transaction count error:', error.message);
            return 0;
        }
    }

    /**
     * Get default policy
     * @returns {Object} Default policy
     */
    getDefaultPolicy() {
        const web3 = blockchainService.getWeb3();
        return {
            max_daily_spend: web3.utils.toWei('1', 'ether'), // 1 BNB
            max_single_tx: web3.utils.toWei('0.1', 'ether'), // 0.1 BNB
            daily_tx_limit: 100,
            allowed_addresses: [],
            denied_addresses: [],
            allowed_actions: ['transfer', 'swap', 'call'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    /**
     * Get today's key for tracking
     * @returns {string} Today's date key
     */
    getTodayKey() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    /**
     * Clear old tracking data
     * @returns {void}
     */
    clearOldTracking() {
        const today = this.getTodayKey();

        for (const [key, value] of this.dailyTracking.entries()) {
            if (!key.endsWith(today)) {
                this.dailyTracking.delete(key);
            }
        }

        logger.info('Old tracking data cleared');
    }

    /**
     * Get policy summary
     * @param {string} userId - User identifier
     * @returns {Promise<Object>} Policy summary
     */
    async getPolicySummary(userId) {
        try {
            const policy = await this.getPolicy(userId);
            const dailySpent = await this.getDailySpending(userId);
            const dailyTxCount = await this.getDailyTransactionCount(userId);

            const web3 = blockchainService.getWeb3();

            return {
                user_id: userId,
                limits: {
                    max_daily_spend_bnb: web3.utils.fromWei(policy.max_daily_spend, 'ether'),
                    max_single_tx_bnb: web3.utils.fromWei(policy.max_single_tx, 'ether'),
                    daily_tx_limit: policy.daily_tx_limit
                },
                today: {
                    spent_bnb: web3.utils.fromWei(dailySpent, 'ether'),
                    tx_count: dailyTxCount,
                    remaining_bnb: web3.utils.fromWei(
                        (BigInt(policy.max_daily_spend) - BigInt(dailySpent)).toString(),
                        'ether'
                    ),
                    remaining_txs: policy.daily_tx_limit - dailyTxCount
                },
                addresses: {
                    allowed_count: policy.allowed_addresses.length,
                    denied_count: policy.denied_addresses.length
                },
                allowed_actions: policy.allowed_actions
            };
        } catch (error) {
            logger.error('Get policy summary error:', error.message);
            throw new Error(`Failed to get policy summary: ${error.message}`);
        }
    }
}

module.exports = new PolicyService();
