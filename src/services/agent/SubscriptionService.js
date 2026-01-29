const logger = require('../../utils/logger');
const membaseService = require('../memory/MembaseService');

/**
 * Subscription Service
 * Manages tiered access for AI Agents
 * Inspired by PayStream Brief
 */
class SubscriptionService {
    constructor() {
        this.subscriptions = new Map(); // userId -> tier
    }

    async subscribe(userId, tier = 'basic') {
        const tiers = {
            'basic': { price: 0, memoryLimit: 100, features: ['research'] },
            'pro': { price: 1.00, memoryLimit: 1000, features: ['research', 'audit', 'negotiate'] },
            'enterprise': { price: 10.00, memoryLimit: 10000, features: ['all'] }
        };

        if (!tiers[tier]) throw new Error(`Invalid tier: ${tier}`);

        this.subscriptions.set(userId, {
            tier,
            ...tiers[tier],
            startedAt: new Date().toISOString()
        });

        // Store in verifiable memory
        await membaseService.storeAIP(userId, `Upgraded to ${tier.toUpperCase()} tier.`, {
            type: 'subscription_upgrade',
            tier
        });

        logger.info('User subscribed', { userId, tier });
        return this.subscriptions.get(userId);
    }

    getSubscription(userId) {
        return this.subscriptions.get(userId) || { tier: 'free', memoryLimit: 10, features: ['basic_research'] };
    }
}

module.exports = new SubscriptionService();
