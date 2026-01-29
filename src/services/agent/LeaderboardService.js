const logger = require('../../utils/logger');
const pointsService = require('./PointsService');
const meteringService = require('./MeteringService');

/**
 * Leaderboard Service
 * Aggregates points and usage data to create competitive rankings
 * Inspired by the user's desire for campaigns and leaderboard traction.
 */
class LeaderboardService {
    /**
     * Get the top users by points
     */
    getTopUsers(limit = 10) {
        const users = Array.from(pointsService.userPoints.entries())
            .map(([userId, points]) => ({ userId, points }))
            .sort((a, b) => b.points - a.points);

        return users.slice(0, limit);
    }

    /**
     * Get the top agents by performance (Savings or Earnings)
     */
    getTopAgents(limit = 10) {
        const stats = meteringService.usageLogs;
        const agentStats = new Map();

        stats.forEach(log => {
            const current = agentStats.get(log.userId) || { actions: 0, volume: 0 };
            agentStats.set(log.userId, {
                actions: current.actions + 1,
                volume: current.volume + (log.cost || 0)
            });
        });

        const sorted = Array.from(agentStats.entries())
            .map(([agentId, data]) => ({ agentId, ...data }))
            .sort((a, b) => b.volume - a.volume);

        return sorted.slice(0, limit);
    }

    /**
     * Get the "Impact" leaderboard: total verifiable memory entries
     */
    async getImpactLeaderboard(limit = 10) {
        // This would ideally query Membase/AIP logs
        // For now, we use the action count as a proxy for impact
        return this.getTopAgents(limit);
    }
}

module.exports = new LeaderboardService();
