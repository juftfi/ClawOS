const logger = require('../../utils/logger');

/**
 * Metering Service
 * Tracks usage-based metrics for the dashboard
 * Inspired by PayStream Brief
 */
class MeteringService {
    constructor() {
        this.usageLogs = []; // Array of { userId, action, cost, timestamp }
    }

    /**
     * Record a usage event
     */
    async recordUsage(userId, action, cost = 0) {
        const entry = {
            userId,
            action,
            cost,
            timestamp: new Date().toISOString()
        };

        this.usageLogs.push(entry);
        logger.info('Usage recorded', { userId, action, cost });
        return entry;
    }

    /**
     * Get usage statistics for a user
     */
    getUserStats(userId) {
        const userLogs = this.usageLogs.filter(l => l.userId === userId);
        return {
            totalCalls: userLogs.length,
            totalSpend: userLogs.reduce((sum, l) => sum + l.cost, 0),
            history: userLogs
        };
    }

    /**
     * Get global platform stats (for the Investor dashboard)
     */
    getGlobalStats() {
        return {
            totalVolume: this.usageLogs.reduce((sum, l) => sum + l.cost, 0),
            totalActions: this.usageLogs.length,
            platformFees: this.usageLogs.reduce((sum, l) => sum + (l.cost * 0.01), 0) // 1% platform fee
        };
    }
}

module.exports = new MeteringService();
