const logger = require('../../utils/logger');
const membaseService = require('../memory/MembaseService');

/**
 * Service Registry
 * Manages B2B service agents and their offerings
 * Inspired by AgentBridge Brief
 */
class ServiceRegistry {
    constructor() {
        this.services = new Map();
        // Pre-populate with verified ecosystem partners
        this.initDefaultServices();
    }

    initDefaultServices() {
        const defaults = [
            {
                id: 'chaingpt-auditor',
                name: 'ChainGPT Contract Auditor',
                category: 'Development',
                description: 'Autonomous smart contract security audits using ChainGPT Hub V2.',
                pricing: {
                    type: 'pay-per-use',
                    amount: '0.05',
                    currency: 'USDC'
                },
                provider: '0x2f914bcbad5bf4967bbb11e4372200b7c7594aeb',
                reputation: 99
            },
            {
                id: 'unibase-memory',
                name: 'Unibase Immortal Memory',
                category: 'Infrastructure',
                description: 'Permanent, verifiable ZK-backed memory storage for AI agents.',
                pricing: {
                    type: 'subscription',
                    amount: '1.00',
                    currency: 'USDC',
                    period: 'monthly'
                },
                provider: '0x2f914bcbad5bf4967bbb11e4372200b7c7594aeb',
                reputation: 98
            },
            {
                id: 'quack-paystream',
                name: 'Quack Payment Rails',
                category: 'Finance',
                description: 'Low-latency, non-custodial payment streaming using EIP-7702.',
                pricing: {
                    type: 'fee',
                    percent: 0.5
                },
                provider: '0x2f914bcbad5bf4967bbb11e4372200b7c7594aeb',
                reputation: 97
            }
        ];

        defaults.forEach(s => this.services.set(s.id, s));
    }

    /**
     * Register a new B2B service
     */
    async registerService(serviceData) {
        const { id, name, category, pricing, provider } = serviceData;

        if (!id || !name || !provider) {
            throw new Error('Missing required service fields: id, name, provider');
        }

        const service = {
            ...serviceData,
            reputation: 50, // Initial reputation
            registeredAt: new Date().toISOString()
        };

        this.services.set(id, service);

        // Persist to AIP memory for verifiability
        await membaseService.storeAIP('system', `Registered new service: ${name} by ${provider}`, {
            serviceId: id,
            type: 'service_registration'
        });

        logger.info('Service registered successfully', { id, name });
        return service;
    }

    /**
     * Search services by category or query
     */
    searchServices(query, category = null) {
        let results = Array.from(this.services.values());

        // If category provided, filter strictly by it first
        if (category) {
            results = results.filter(s => s.category.toLowerCase() === category.toLowerCase());
        }

        // If specific services found for category and query is provided, filter them by relevant keywords
        if (query && results.length > 0) {
            const lowQuery = query.toLowerCase();
            const keywords = ['audit', 'security', 'memory', 'payment', 'swap', 'dev', 'infra'];

            // Check if any keyword in query matches name or description of the service
            const matchedByKeyword = results.filter(s =>
                keywords.some(k => lowQuery.includes(k) && (s.name.toLowerCase().includes(k) || s.description.toLowerCase().includes(k)))
            );

            // Only switch to keyword matches if we found any, otherwise return category matches
            if (matchedByKeyword.length > 0) {
                results = matchedByKeyword;
            }
        }

        return results.sort((a, b) => b.reputation - a.reputation);
    }

    getService(id) {
        return this.services.get(id);
    }
}

module.exports = new ServiceRegistry();
