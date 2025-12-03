const riskAssessmentService = require('../risk/RiskAssessmentService');
const blockchainService = require('../blockchain/BlockchainService');
const membaseService = require('../memory/MembaseService');
const logger = require('../../utils/logger');

class PreviewService {
    constructor() {
        this.bnbPriceUSD = 300; // Fallback price, should be fetched from API
    }

    /**
     * Generate transaction preview
     * @param {Object} transaction - Transaction details
     * @returns {Promise<Object>} Transaction preview
     */
    async generatePreview(transaction) {
        try {
            // Format transaction
            const formatted = await this.formatTransaction(transaction);

            // Calculate total cost
            const costs = await this.calculateTotalCost(
                transaction.gas_estimate,
                transaction.amount
            );

            // Get risk assessment
            const riskAssessment = await riskAssessmentService.assessTransaction(transaction);

            // Get historical comparison
            const comparison = await this.getHistoricalComparison(
                transaction.action,
                transaction.user_id
            );

            // Generate summary
            const summary = this.generateSummary(transaction);

            logger.info('Preview generated', {
                action: transaction.action,
                riskLevel: riskAssessment.risk_level
            });

            return {
                summary,
                details: formatted,
                costs,
                risk_level: riskAssessment.risk_level,
                risks: riskAssessment.risks,
                warnings: this.generateWarnings(riskAssessment.risks),
                recommendations: riskAssessment.recommendations,
                historical_comparison: comparison,
                can_execute: riskAssessment.can_execute,
                estimated_duration: this.estimateDuration(transaction.action),
                created_at: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Generate preview error:', error.message);
            throw new Error(`Failed to generate preview: ${error.message}`);
        }
    }

    /**
     * Format transaction for display
     * @param {Object} txData - Transaction data
     * @returns {Promise<Object>} Formatted transaction
     */
    async formatTransaction(txData) {
        try {
            const web3 = blockchainService.getWeb3();

            const formatted = {
                action: this.formatAction(txData.action),
                from: this.formatAddress(txData.from),
                to: this.formatAddress(txData.recipient || txData.to),
                amount: `${txData.amount} ${txData.token || 'BNB'}`,
                amount_usd: this.formatUSD(parseFloat(txData.amount)),
                currency: txData.token || 'BNB',
                network: 'BNB Smart Chain Testnet',
                chain_id: 97
            };

            // Add action-specific details
            if (txData.action === 'swap') {
                formatted.from_token = txData.from_token || 'BNB';
                formatted.to_token = txData.to_token;
                formatted.slippage = `${txData.slippage || 0.5}%`;
                formatted.expected_output = txData.expected_output;
            }

            if (txData.action === 'call') {
                formatted.contract = this.formatAddress(txData.contract_address);
                formatted.method = txData.method;
                formatted.params = txData.params;
            }

            return formatted;
        } catch (error) {
            logger.error('Format transaction error:', error.message);
            throw new Error(`Failed to format transaction: ${error.message}`);
        }
    }

    /**
     * Calculate total transaction cost
     * @param {Object} gasEstimate - Gas estimate
     * @param {string} amount - Transaction amount
     * @returns {Promise<Object>} Cost breakdown
     */
    async calculateTotalCost(gasEstimate, amount) {
        try {
            const web3 = blockchainService.getWeb3();

            const amountBNB = parseFloat(amount || 0);
            const gasCostBNB = gasEstimate ? parseFloat(gasEstimate.estimated_cost_bnb) : 0;
            const totalBNB = amountBNB + gasCostBNB;

            const costs = {
                amount_bnb: amountBNB.toFixed(6),
                amount_usd: this.formatUSD(amountBNB),
                gas_limit: gasEstimate ? gasEstimate.gas_limit : 'Unknown',
                gas_price_gwei: gasEstimate ? gasEstimate.gas_price_gwei : 'Unknown',
                gas_cost_bnb: gasCostBNB.toFixed(6),
                gas_cost_usd: this.formatUSD(gasCostBNB),
                total_cost_bnb: totalBNB.toFixed(6),
                total_cost_usd: this.formatUSD(totalBNB),
                breakdown: {
                    transaction: `${amountBNB.toFixed(6)} BNB (${this.formatUSD(amountBNB)})`,
                    gas: `${gasCostBNB.toFixed(6)} BNB (${this.formatUSD(gasCostBNB)})`,
                    total: `${totalBNB.toFixed(6)} BNB (${this.formatUSD(totalBNB)})`
                }
            };

            return costs;
        } catch (error) {
            logger.error('Calculate total cost error:', error.message);
            throw new Error(`Failed to calculate total cost: ${error.message}`);
        }
    }

    /**
     * Get historical comparison
     * @param {string} transactionType - Type of transaction
     * @param {string} userId - User identifier
     * @returns {Promise<Object>} Historical comparison
     */
    async getHistoricalComparison(transactionType, userId) {
        try {
            if (!userId) {
                return {
                    available: false,
                    message: 'No user history available'
                };
            }

            const history = await membaseService.queryMemory(
                'payments',
                { user_id: userId, action: transactionType },
                50
            );

            if (history.length === 0) {
                return {
                    available: false,
                    message: `No previous ${transactionType} transactions found`
                };
            }

            // Calculate statistics
            const amounts = history.map(h => parseFloat(h.amount)).filter(a => !isNaN(a));
            const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
            const minAmount = Math.min(...amounts);
            const maxAmount = Math.max(...amounts);

            const gasCosts = history
                .map(h => parseFloat(h.gas_cost_bnb))
                .filter(g => !isNaN(g));
            const avgGasCost = gasCosts.length > 0
                ? gasCosts.reduce((sum, g) => sum + g, 0) / gasCosts.length
                : 0;

            return {
                available: true,
                transaction_count: history.length,
                amount_stats: {
                    average: avgAmount.toFixed(6),
                    min: minAmount.toFixed(6),
                    max: maxAmount.toFixed(6)
                },
                gas_stats: {
                    average_cost_bnb: avgGasCost.toFixed(6),
                    average_cost_usd: this.formatUSD(avgGasCost)
                },
                last_transaction: history[0].timestamp
            };
        } catch (error) {
            logger.error('Get historical comparison error:', error.message);
            return {
                available: false,
                message: 'Error fetching historical data'
            };
        }
    }

    /**
     * Generate transaction summary
     * @param {Object} transaction - Transaction details
     * @returns {string} Human-readable summary
     */
    generateSummary(transaction) {
        const action = transaction.action;
        const amount = transaction.amount;
        const token = transaction.token || 'BNB';
        const recipient = this.formatAddress(transaction.recipient || transaction.to);

        switch (action) {
            case 'transfer':
                return `Transfer ${amount} ${token} to ${recipient}`;

            case 'swap':
                const fromToken = transaction.from_token || 'BNB';
                const toToken = transaction.to_token;
                return `Swap ${amount} ${fromToken} for ${toToken}`;

            case 'call':
                const contract = this.formatAddress(transaction.contract_address);
                const method = transaction.method;
                return `Call ${method} on contract ${contract}`;

            case 'deploy':
                return `Deploy smart contract`;

            default:
                return `Execute ${action} transaction`;
        }
    }

    /**
     * Generate warnings from risks
     * @param {Array} risks - Identified risks
     * @returns {Array} Warning messages
     */
    generateWarnings(risks) {
        return risks.map(risk => ({
            type: risk.type,
            severity: risk.severity,
            message: risk.message,
            icon: this.getWarningIcon(risk.severity)
        }));
    }

    /**
     * Get warning icon based on severity
     * @param {string} severity - Risk severity
     * @returns {string} Icon/emoji
     */
    getWarningIcon(severity) {
        const icons = {
            low: 'ℹ️',
            medium: '⚠️',
            high: '🚨',
            critical: '🛑'
        };
        return icons[severity] || 'ℹ️';
    }

    /**
     * Estimate transaction duration
     * @param {string} action - Transaction action
     * @returns {string} Duration estimate
     */
    estimateDuration(action) {
        const durations = {
            transfer: '30-60 seconds',
            swap: '1-2 minutes',
            call: '30-90 seconds',
            deploy: '2-5 minutes'
        };
        return durations[action] || '30-90 seconds';
    }

    /**
     * Format action name
     * @param {string} action - Action type
     * @returns {string} Formatted action
     */
    formatAction(action) {
        const actions = {
            transfer: 'Transfer',
            swap: 'Token Swap',
            call: 'Contract Call',
            deploy: 'Contract Deployment'
        };
        return actions[action] || action.charAt(0).toUpperCase() + action.slice(1);
    }

    /**
     * Format address for display
     * @param {string} address - Ethereum address
     * @returns {string} Formatted address
     */
    formatAddress(address) {
        if (!address) return 'Unknown';
        if (address.length < 42) return address;
        return `${address.substring(0, 6)}...${address.substring(38)}`;
    }

    /**
     * Format USD value
     * @param {number} bnbAmount - Amount in BNB
     * @returns {string} Formatted USD value
     */
    formatUSD(bnbAmount) {
        const usdValue = bnbAmount * this.bnbPriceUSD;
        return `$${usdValue.toFixed(2)}`;
    }

    /**
     * Update BNB price
     * @param {number} priceUSD - BNB price in USD
     */
    updateBNBPrice(priceUSD) {
        this.bnbPriceUSD = priceUSD;
        logger.info('BNB price updated', { priceUSD });
    }

    /**
     * Get current BNB price
     * @returns {number} BNB price in USD
     */
    getBNBPrice() {
        return this.bnbPriceUSD;
    }

    /**
     * Generate comparison chart data
     * @param {Object} transaction - Transaction details
     * @param {Object} historical - Historical comparison
     * @returns {Object} Chart data
     */
    generateComparisonChart(transaction, historical) {
        if (!historical.available) {
            return null;
        }

        const currentAmount = parseFloat(transaction.amount);
        const avgAmount = parseFloat(historical.amount_stats.average);

        return {
            labels: ['Current', 'Average', 'Min', 'Max'],
            values: [
                currentAmount,
                avgAmount,
                parseFloat(historical.amount_stats.min),
                parseFloat(historical.amount_stats.max)
            ],
            comparison: {
                vs_average: ((currentAmount / avgAmount - 1) * 100).toFixed(1) + '%',
                is_above_average: currentAmount > avgAmount
            }
        };
    }
}

module.exports = new PreviewService();
