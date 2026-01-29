const logger = require('../../utils/logger');
const membaseService = require('../memory/MembaseService');

/**
 * Points Service
 * Manages user and agent reward points (Agent Alpha Points)
 * Inspired by the user's desire for traction and rewards.
 */
class PointsService {
    constructor() {
        this.userPoints = new Map(); // userId -> points
        this.agentPoints = new Map(); // agentId -> points
    }

    /**
     * Award points for a specific action
     */
    async awardPoints(id, type, amount, isAgent = false) {
        const currentPoints = isAgent ? (this.agentPoints.get(id) || 0) : (this.userPoints.get(id) || 0);
        const newTotal = currentPoints + amount;

        if (isAgent) {
            this.agentPoints.set(id, newTotal);
        } else {
            this.userPoints.set(id, newTotal);
        }

        // Store verifiable points update in Membase
        await membaseService.storeAIP(id, `Awarded ${amount} points for ${type}. Total: ${newTotal}`, {
            type: 'points_award',
            points: amount,
            action: type
        });

        logger.info(`Points awarded to ${isAgent ? 'agent' : 'user'} ${id}`, { amount, type, newTotal });
        return newTotal;
    }

    getPoints(id, isAgent = false) {
        return isAgent ? (this.agentPoints.get(id) || 0) : (this.userPoints.get(id) || 0);
    }
}

module.exports = new PointsService();
