const axios = require('axios');
const logger = require('../../utils/logger');

class MembaseService {
    constructor() {
        this.apiUrl = process.env.UNIBASE_API_URL || 'https://api.unibase.io';
        this.apiKey = process.env.UNIBASE_API_KEY;
        this.projectId = process.env.UNIBASE_PROJECT_ID || 'agentos-web3';

        // In-memory fallback storage
        this.fallbackStorage = {
            conversations: new Map(),
            preferences: new Map(),
            transactions: new Map(),
            contracts: new Map()
        };

        this.usesFallback = false;
        this.operationQueue = [];
    }

    /**
     * Store conversation message
     * @param {string} agentId - Agent identifier
     * @param {string} userMessage - User's message
     * @param {string} aiResponse - AI's response
     * @param {string} timestamp - Message timestamp
     * @returns {Promise<Object>} Storage result
     */
    async storeConversation(agentId, userMessage, aiResponse, timestamp = new Date().toISOString()) {
        const data = {
            agent_id: agentId,
            user_message: userMessage,
            ai_response: aiResponse,
            timestamp,
            created_at: new Date().toISOString()
        };

        try {
            const result = await this.store('conversations', data);

            logger.info('Conversation stored', { agentId, timestamp });
            return result;
        } catch (error) {
            logger.error('Store conversation error:', error.message);
            return this.fallbackStore('conversations', agentId, data);
        }
    }

    // ... (skipping getConversationHistory)

    async storeUserPreference(userId, key, value) {
        const data = {
            user_id: userId,
            key,
            value,
            updated_at: new Date().toISOString()
        };

        try {
            const result = await this.store('preferences', data);

            logger.info('User preference stored', { userId, key });
            return result;
        } catch (error) {
            logger.error('Store user preference error:', error.message);
            return this.fallbackStore('preferences', `${userId}:${key}`, data);
        }
    }

    // ... (skipping getUserPreferences)

    async storeTransaction(txHash, txDetails, timestamp = new Date().toISOString()) {
        const data = {
            tx_hash: txHash,
            agent_id: txDetails.agent_id || 'unknown',
            from: txDetails.from,
            to: txDetails.to,
            value: txDetails.value,
            status: txDetails.status,
            gas_used: txDetails.gas_used,
            block_number: txDetails.block_number,
            timestamp,
            details: txDetails,
            created_at: new Date().toISOString()
        };

        try {
            const result = await this.store('transactions', data);

            logger.info('Transaction stored', { txHash, timestamp });
            return result;
        } catch (error) {
            logger.error('Store transaction error:', error.message);
            return this.fallbackStore('transactions', txHash, data);
        }
    }

    // ... (skipping getTransactionLog)

    async storeContractTemplate(templateName, contractCode, abi) {
        const data = {
            name: templateName,
            code: contractCode,
            abi,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        try {
            const result = await this.store('contracts', data);

            logger.info('Contract template stored', { templateName });
            return result;
        } catch (error) {
            logger.error('Store contract template error:', error.message);
            return this.fallbackStore('contracts', templateName, data);
        }
    }

    /**
     * Get contract template
     * @param {string} templateName - Template name
     * @returns {Promise<Object>} Contract template
     */
    async getContractTemplate(templateName) {
        try {
            const filter = { name: templateName };
            const results = await this.query('contracts', filter, 1);

            if (results.length === 0) {
                throw new Error(`Contract template '${templateName}' not found`);
            }

            logger.info('Retrieved contract template', { templateName });
            return results[0];
        } catch (error) {
            logger.error('Get contract template error:', error.message);
            return this.fallbackQuery('contracts', templateName, 1)[0] || null;
        }
    }

    /**
     * Query memory with advanced filters
     * @param {string} collection - Collection name
     * @param {Object} filters - Query filters
     * @param {number} limit - Result limit
     * @returns {Promise<Array>} Query results
     */
    async queryMemory(collection, filters = {}, limit = 100) {
        try {
            const results = await this.query(collection, filters, limit);

            logger.info('Memory query executed', { collection, filters, count: results.length });
            return results;
        } catch (error) {
            logger.error('Query memory error:', error.message);
            return [];
        }
    }

    /**
     * Store data in Unibase
     * @param {string} collection - Collection name
     * @param {Object} data - Data to store
     * @returns {Promise<Object>} Storage result
     */
    async store(collection, data) {
        try {
            if (!this.apiKey) {
                throw new Error('Unibase API key not configured');
            }

            const response = await axios.post(
                `${this.apiUrl}/store`,
                {
                    project_id: this.projectId,
                    collection,
                    data
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            return {
                success: true,
                id: response.data.id || this.generateId(),
                collection,
                data
            };
        } catch (error) {
            if (error.response?.status === 429) {
                logger.warn('Unibase rate limit hit, queueing operation');
                this.queueOperation('store', collection, data);
            }
            throw error;
        }
    }

    /**
     * Query data from Unibase
     * @param {string} collection - Collection name
     * @param {Object} filter - Query filter
     * @param {number} limit - Result limit
     * @returns {Promise<Array>} Query results
     */
    async query(collection, filter = {}, limit = 100) {
        try {
            if (!this.apiKey) {
                throw new Error('Unibase API key not configured');
            }

            const response = await axios.post(
                `${this.apiUrl}/query`,
                {
                    project_id: this.projectId,
                    collection,
                    filter,
                    limit
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            return response.data.results || [];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Fallback store (in-memory)
     * @param {string} collection - Collection name
     * @param {string} key - Storage key
     * @param {Object} data - Data to store
     * @returns {Object} Storage result
     */
    fallbackStore(collection, key, data) {
        this.usesFallback = true;

        if (!this.fallbackStorage[collection]) {
            this.fallbackStorage[collection] = new Map();
        }

        this.fallbackStorage[collection].set(key, data);

        logger.warn(`Using fallback storage for ${collection}:${key}`);

        return {
            success: true,
            id: key,
            collection,
            data,
            fallback: true
        };
    }

    /**
     * Fallback query (in-memory)
     * @param {string} collection - Collection name
     * @param {string} key - Query key
     * @param {number} limit - Result limit
     * @returns {Array} Query results
     */
    fallbackQuery(collection, key, limit = 100) {
        this.usesFallback = true;

        if (!this.fallbackStorage[collection]) {
            return [];
        }

        const results = [];
        for (const [k, v] of this.fallbackStorage[collection].entries()) {
            if (k.includes(key)) {
                results.push(v);
            }
            if (results.length >= limit) break;
        }

        logger.warn(`Using fallback query for ${collection}:${key}`);
        return results;
    }

    /**
     * Queue operation for retry
     * @param {string} operation - Operation type
     * @param {string} collection - Collection name
     * @param {Object} data - Operation data
     */
    queueOperation(operation, collection, data) {
        this.operationQueue.push({
            operation,
            collection,
            data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Process queued operations
     * @returns {Promise<void>}
     */
    async processQueue() {
        if (this.operationQueue.length === 0) return;

        logger.info(`Processing ${this.operationQueue.length} queued operations`);

        const operations = [...this.operationQueue];
        this.operationQueue = [];

        for (const op of operations) {
            try {
                if (op.operation === 'store') {
                    await this.store(op.collection, op.data);
                }
            } catch (error) {
                logger.error('Failed to process queued operation:', error.message);
                this.operationQueue.push(op); // Re-queue
            }
        }
    }

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get storage statistics
     * @returns {Object} Storage stats
     */
    getStats() {
        return {
            uses_fallback: this.usesFallback,
            queued_operations: this.operationQueue.length,
            fallback_storage: {
                conversations: this.fallbackStorage.conversations.size,
                preferences: this.fallbackStorage.preferences.size,
                transactions: this.fallbackStorage.transactions.size,
                contracts: this.fallbackStorage.contracts.size
            }
        };
    }
}

module.exports = new MembaseService();
