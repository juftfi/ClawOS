const blockchainService = require('../blockchain/BlockchainService');
const membaseService = require('../memory/MembaseService');
const logger = require('../../utils/logger');

class RiskAssessmentService {
    constructor() {
        this.knownBadAddresses = new Set([
            // Add known scam/malicious addresses here
            '0x0000000000000000000000000000000000000000'
        ]);

        this.gasHistory = [];
        this.maxGasHistorySize = 100;
    }

    /**
     * Assess transaction risk
     * @param {Object} transaction - Transaction details
     * @returns {Promise<Object>} Risk assessment
     */
    async assessTransaction(transaction) {
        try {
            const risks = await this.identifyRisks(transaction);
            const riskLevel = this.calculateRiskLevel(risks);
            const recommendations = await this.getRecommendations(transaction, risks);

            logger.info('Transaction assessed', { riskLevel, riskCount: risks.length });

            return {
                risk_level: riskLevel,
                risks,
                recommendations,
                can_execute: riskLevel !== 'CRITICAL',
                assessed_at: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Assess transaction error:', error.message);
            throw new Error(`Failed to assess transaction: ${error.message}`);
        }
    }

    /**
     * Identify all risks in transaction
     * @param {Object} transaction - Transaction details
     * @returns {Promise<Array>} List of identified risks
     */
    async identifyRisks(transaction) {
        const risks = [];

        try {
            // Check gas price
            const gasRisk = await this.checkGasPrice(transaction.gas_estimate);
            if (gasRisk) risks.push(gasRisk);

            // Check amount
            const amountRisk = await this.checkAmount(
                transaction.amount,
                transaction.user_id
            );
            if (amountRisk) risks.push(amountRisk);

            // Check recipient
            const recipientRisk = await this.checkRecipient(
                transaction.recipient,
                transaction.user_id
            );
            if (recipientRisk) risks.push(recipientRisk);

            // Check balance
            const balanceRisk = await this.checkBalance(
                transaction.from,
                transaction.amount,
                transaction.gas_estimate
            );
            if (balanceRisk) risks.push(balanceRisk);

            // Check transaction frequency
            const frequencyRisk = await this.checkTransactionFrequency(
                transaction.user_id
            );
            if (frequencyRisk) risks.push(frequencyRisk);

            // Check for suspicious patterns
            const patternRisks = await this.checkSuspiciousPatterns(transaction);
            risks.push(...patternRisks);

            return risks;
        } catch (error) {
            logger.error('Identify risks error:', error.message);
            return risks;
        }
    }

    /**
     * Get recommendations based on transaction and risks
     * @param {Object} transaction - Transaction details
     * @param {Array} risks - Identified risks
     * @returns {Promise<Array>} Recommendations
     */
    async getRecommendations(transaction, risks) {
        const recommendations = [];

        try {
            // Gas price recommendations
            const highGasRisk = risks.find(r => r.type === 'high_gas_price');
            if (highGasRisk) {
                recommendations.push({
                    type: 'gas_optimization',
                    message: 'Consider waiting for lower gas prices',
                    action: 'Wait 1-2 hours for gas prices to decrease',
                    priority: 'medium'
                });
            }

            // Amount recommendations
            const highAmountRisk = risks.find(r => r.type === 'unusual_amount');
            if (highAmountRisk) {
                recommendations.push({
                    type: 'amount_verification',
                    message: 'Verify the transaction amount is correct',
                    action: 'Double-check the amount before proceeding',
                    priority: 'high'
                });
            }

            // Recipient recommendations
            const newRecipientRisk = risks.find(r => r.type === 'new_recipient');
            if (newRecipientRisk) {
                recommendations.push({
                    type: 'recipient_verification',
                    message: 'Verify the recipient address',
                    action: 'Confirm this is the correct recipient address',
                    priority: 'high'
                });
            }

            const blockedRecipientRisk = risks.find(r => r.type === 'blocked_address');
            if (blockedRecipientRisk) {
                recommendations.push({
                    type: 'address_warning',
                    message: 'This address is flagged as suspicious',
                    action: 'Do not proceed with this transaction',
                    priority: 'critical'
                });
            }

            // Balance recommendations
            const insufficientBalanceRisk = risks.find(r => r.type === 'insufficient_balance');
            if (insufficientBalanceRisk) {
                recommendations.push({
                    type: 'add_funds',
                    message: 'Insufficient balance to complete transaction',
                    action: 'Add more BNB to your wallet',
                    priority: 'critical'
                });
            }

            // Frequency recommendations
            const frequencyRisk = risks.find(r => r.type === 'high_frequency');
            if (frequencyRisk) {
                recommendations.push({
                    type: 'rate_limiting',
                    message: 'You are making many transactions',
                    action: 'Consider batching transactions to save on gas',
                    priority: 'low'
                });
            }

            // General security recommendation
            if (risks.length === 0) {
                recommendations.push({
                    type: 'general',
                    message: 'Transaction appears safe',
                    action: 'Proceed with transaction',
                    priority: 'low'
                });
            }

            return recommendations;
        } catch (error) {
            logger.error('Get recommendations error:', error.message);
            return recommendations;
        }
    }

    /**
     * Check gas price against historical average
     * @param {Object} gasEstimate - Gas estimate object
     * @returns {Promise<Object|null>} Gas risk if found
     */
    async checkGasPrice(gasEstimate) {
        try {
            if (!gasEstimate || !gasEstimate.gas_price_gwei) {
                return null;
            }

            const currentGasPrice = parseFloat(gasEstimate.gas_price_gwei);
            const averageGasPrice = await this.getAverageGasPrice();

            if (currentGasPrice > averageGasPrice * 1.5) {
                return {
                    type: 'high_gas_price',
                    severity: 'medium',
                    message: `High gas price: ${currentGasPrice.toFixed(2)} Gwei (avg: ${averageGasPrice.toFixed(2)} Gwei)`,
                    details: {
                        current: currentGasPrice,
                        average: averageGasPrice,
                        percentage_above: Math.round(((currentGasPrice / averageGasPrice) - 1) * 100)
                    }
                };
            }

            return null;
        } catch (error) {
            logger.error('Check gas price error:', error.message);
            return null;
        }
    }

    /**
     * Check amount against user's historical average
     * @param {string} amount - Transaction amount
     * @param {string} userId - User identifier
     * @returns {Promise<Object|null>} Amount risk if found
     */
    async checkAmount(amount, userId) {
        try {
            if (!amount || !userId) return null;

            const web3 = blockchainService.getWeb3();
            const amountBNB = parseFloat(amount);

            // Get user's transaction history
            const history = await membaseService.queryMemory('payments', { user_id: userId }, 50);

            if (history.length === 0) {
                // First transaction - flag as new user
                return {
                    type: 'first_transaction',
                    severity: 'low',
                    message: 'This is your first transaction',
                    details: {
                        amount: amountBNB
                    }
                };
            }

            // Calculate average transaction amount
            const amounts = history.map(h => parseFloat(h.amount)).filter(a => !isNaN(a));
            const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
            const maxAmount = Math.max(...amounts);

            if (amountBNB > avgAmount * 2 && amountBNB > 0.1) {
                return {
                    type: 'unusual_amount',
                    severity: 'medium',
                    message: `Unusual amount: ${amountBNB} BNB (avg: ${avgAmount.toFixed(4)} BNB)`,
                    details: {
                        current: amountBNB,
                        average: avgAmount,
                        max_previous: maxAmount,
                        times_above_average: (amountBNB / avgAmount).toFixed(1)
                    }
                };
            }

            return null;
        } catch (error) {
            logger.error('Check amount error:', error.message);
            return null;
        }
    }

    /**
     * Check recipient address for risks
     * @param {string} address - Recipient address
     * @param {string} userId - User identifier
     * @returns {Promise<Object|null>} Recipient risk if found
     */
    async checkRecipient(address, userId) {
        try {
            if (!address) return null;

            // Check against known bad addresses
            if (this.knownBadAddresses.has(address.toLowerCase())) {
                return {
                    type: 'blocked_address',
                    severity: 'critical',
                    message: 'This address is flagged as suspicious or malicious',
                    details: {
                        address,
                        reason: 'Known scam or malicious address'
                    }
                };
            }

            // Check if recipient is new for this user
            if (userId) {
                const history = await membaseService.queryMemory('payments', { user_id: userId }, 100);
                const hasTransactedBefore = history.some(h =>
                    h.recipient && h.recipient.toLowerCase() === address.toLowerCase()
                );

                if (!hasTransactedBefore) {
                    return {
                        type: 'new_recipient',
                        severity: 'low',
                        message: 'This is a new recipient address',
                        details: {
                            address,
                            first_time: true
                        }
                    };
                }
            }

            return null;
        } catch (error) {
            logger.error('Check recipient error:', error.message);
            return null;
        }
    }

    /**
     * Check if user has sufficient balance
     * @param {string} from - Sender address
     * @param {string} amount - Transaction amount
     * @param {Object} gasEstimate - Gas estimate
     * @returns {Promise<Object|null>} Balance risk if found
     */
    async checkBalance(from, amount, gasEstimate) {
        try {
            if (!from || !amount) return null;

            const web3 = blockchainService.getWeb3();
            const balance = await blockchainService.getBalance(from);

            const amountWei = web3.utils.toWei(amount, 'ether');
            const gasCostWei = gasEstimate ? gasEstimate.estimated_cost_wei : '0';
            const totalNeeded = BigInt(amountWei) + BigInt(gasCostWei);

            if (BigInt(balance.balance_wei) < totalNeeded) {
                const shortfall = totalNeeded - BigInt(balance.balance_wei);
                const shortfallBNB = web3.utils.fromWei(shortfall.toString(), 'ether');

                return {
                    type: 'insufficient_balance',
                    severity: 'critical',
                    message: `Insufficient balance: need ${web3.utils.fromWei(totalNeeded.toString(), 'ether')} BNB, have ${balance.balance_bnb} BNB`,
                    details: {
                        balance: balance.balance_bnb,
                        needed: web3.utils.fromWei(totalNeeded.toString(), 'ether'),
                        shortfall: shortfallBNB
                    }
                };
            }

            // Warn if balance will be very low after transaction
            const remainingBalance = BigInt(balance.balance_wei) - totalNeeded;
            const remainingBNB = parseFloat(web3.utils.fromWei(remainingBalance.toString(), 'ether'));

            if (remainingBNB < 0.01) {
                return {
                    type: 'low_remaining_balance',
                    severity: 'low',
                    message: `Low remaining balance after transaction: ${remainingBNB.toFixed(4)} BNB`,
                    details: {
                        remaining: remainingBNB
                    }
                };
            }

            return null;
        } catch (error) {
            logger.error('Check balance error:', error.message);
            return null;
        }
    }

    /**
     * Check transaction frequency
     * @param {string} userId - User identifier
     * @returns {Promise<Object|null>} Frequency risk if found
     */
    async checkTransactionFrequency(userId) {
        try {
            if (!userId) return null;

            const policyService = require('../x402/PolicyService');
            const dailyTxCount = await policyService.getDailyTransactionCount(userId);

            if (dailyTxCount > 50) {
                return {
                    type: 'high_frequency',
                    severity: 'low',
                    message: `High transaction frequency: ${dailyTxCount} transactions today`,
                    details: {
                        daily_count: dailyTxCount
                    }
                };
            }

            return null;
        } catch (error) {
            logger.error('Check transaction frequency error:', error.message);
            return null;
        }
    }

    /**
     * Check for suspicious patterns
     * @param {Object} transaction - Transaction details
     * @returns {Promise<Array>} Pattern risks
     */
    async checkSuspiciousPatterns(transaction) {
        const risks = [];

        try {
            // Check for round numbers (potential typo)
            const amount = parseFloat(transaction.amount);
            if (amount >= 10 && amount % 10 === 0) {
                risks.push({
                    type: 'round_number',
                    severity: 'low',
                    message: 'Transaction uses a round number - verify amount is correct',
                    details: {
                        amount
                    }
                });
            }

            // Check for very small amounts (dust attack)
            if (amount > 0 && amount < 0.0001) {
                risks.push({
                    type: 'dust_amount',
                    severity: 'low',
                    message: 'Very small transaction amount detected',
                    details: {
                        amount
                    }
                });
            }

            return risks;
        } catch (error) {
            logger.error('Check suspicious patterns error:', error.message);
            return risks;
        }
    }

    /**
     * Calculate overall risk level
     * @param {Array} risks - Identified risks
     * @returns {string} Risk level
     */
    calculateRiskLevel(risks) {
        if (risks.length === 0) return 'LOW';

        const hasCritical = risks.some(r => r.severity === 'critical');
        if (hasCritical) return 'CRITICAL';

        const highCount = risks.filter(r => r.severity === 'high').length;
        if (highCount >= 2) return 'HIGH';
        if (highCount >= 1) return 'HIGH';

        const mediumCount = risks.filter(r => r.severity === 'medium').length;
        if (mediumCount >= 2) return 'MEDIUM';
        if (mediumCount >= 1) return 'MEDIUM';

        return 'LOW';
    }

    /**
     * Get average gas price from history
     * @returns {Promise<number>} Average gas price in Gwei
     */
    async getAverageGasPrice() {
        try {
            if (this.gasHistory.length === 0) {
                // No history, get current price
                const gasPrice = await blockchainService.getGasPrice();
                return parseFloat(gasPrice.gwei);
            }

            const sum = this.gasHistory.reduce((acc, price) => acc + price, 0);
            return sum / this.gasHistory.length;
        } catch (error) {
            logger.error('Get average gas price error:', error.message);
            return 5; // Default fallback
        }
    }

    /**
     * Record gas price for historical tracking
     * @param {number} gasPriceGwei - Gas price in Gwei
     */
    recordGasPrice(gasPriceGwei) {
        this.gasHistory.push(gasPriceGwei);

        if (this.gasHistory.length > this.maxGasHistorySize) {
            this.gasHistory.shift();
        }
    }

    /**
     * Add known bad address
     * @param {string} address - Address to block
     */
    addBadAddress(address) {
        this.knownBadAddresses.add(address.toLowerCase());
        logger.info('Bad address added', { address });
    }

    /**
     * Remove known bad address
     * @param {string} address - Address to unblock
     */
    removeBadAddress(address) {
        this.knownBadAddresses.delete(address.toLowerCase());
        logger.info('Bad address removed', { address });
    }
}

module.exports = new RiskAssessmentService();
