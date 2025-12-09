const logger = require('../../utils/logger');

const fs = require('fs');
const path = require('path');

// Lazy load membase to avoid initialization errors when env vars are missing
let membaseChain = null;
let membaseId = null;
let membaseModuleLoaded = false;

const loadMembaseModule = () => {
    if (!membaseModuleLoaded) {
        try {
            const membaseModule = require('membase');
            membaseChain = membaseModule.membaseChain;
            membaseId = membaseModule.membaseId;
            membaseModuleLoaded = true;
        } catch (error) {
            logger.warn('Failed to load membase module:', error.message);
        }
    }
};

// Try to load on startup, but don't fail if env vars are missing
process.nextTick(() => {
    if (process.env.MEMBASE_ACCOUNT && process.env.MEMBASE_SECRET_KEY) {
        loadMembaseModule();
    }
});

class MembaseService {
    constructor() {
        // Membase SDK configuration
        this.membaseId = process.env.MEMBASE_ID || 'agentos-web3-agent';
        this.account = process.env.MEMBASE_ACCOUNT;
        this.hubUrl = process.env.MEMBASE_HUB || 'https://testnet.hub.membase.io';

        // Data directory for persistence
        this.dataDir = path.join(process.cwd(), 'data');
        this.dataFile = path.join(this.dataDir, 'memory_store.json');

        // Ensure data directory exists
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }

        // Initialize storage hub
        try {
            // Only try to use Storage if membase module was successfully loaded
            const { Storage } = require('membase');
            this.storage = new Storage(this.hubUrl);
            this.isConnected = true;
            logger.info('Membase storage hub connected', { hub: this.hubUrl });
        } catch (error) {
            logger.warn('Membase storage hub connection failed, using local persistent storage', { error: error.message });
            this.storage = null;
            this.isConnected = false;
        }

        // Memory instances cache
        this.memories = new Map();

        // Load persistent data
        this.fallbackStorage = this.loadFromDisk();

        this.usesFallback = !this.isConnected;
        this.operationQueue = [];

        // Check blockchain connection
        if (membaseChain) {
            logger.info('Membase chain connected', {
                wallet: membaseChain.walletAddress,
                rpc: membaseChain.currentRpc
            });
        } else {
            logger.warn('Membase chain not initialized - blockchain features disabled');
        }
    }

    /**
     * Load data from disk
     */
    loadFromDisk() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = fs.readFileSync(this.dataFile, 'utf8');
                const parsed = JSON.parse(data);

                // Convert arrays back to Maps
                return {
                    conversations: new Map(parsed.conversations || []),
                    preferences: new Map(parsed.preferences || []),
                    transactions: new Map(parsed.transactions || []),
                    contracts: new Map(parsed.contracts || [])
                };
            }
        } catch (error) {
            logger.error('Failed to load memory store:', error);
        }

        return {
            conversations: new Map(),
            preferences: new Map(),
            transactions: new Map(),
            contracts: new Map()
        };
    }

    /**
     * Save data to disk
     */
    saveToDisk() {
        try {
            const data = {
                conversations: Array.from(this.fallbackStorage.conversations.entries()),
                preferences: Array.from(this.fallbackStorage.preferences.entries()),
                transactions: Array.from(this.fallbackStorage.transactions.entries()),
                contracts: Array.from(this.fallbackStorage.contracts.entries())
            };
            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
        } catch (error) {
            logger.error('Failed to save memory store:', error);
        }
    }

    /**
     * Get or create BufferedMemory instance for agent
     * @param {string} agentId - Agent identifier
     * @returns {BufferedMemory} Memory instance
     */
    getMemory(agentId) {
        if (!this.memories.has(agentId)) {
            try {
                const memory = new BufferedMemory(
                    agentId,
                    this.account || 'fallback-owner',
                    this.isConnected
                );
                this.memories.set(agentId, memory);
                logger.debug('Created new memory instance', { agentId });
            } catch (error) {
                logger.error('Failed to create memory instance', { agentId, error: error.message });
                return null;
            }
        }
        return this.memories.get(agentId);
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
        try {
            if (this.isConnected && this.storage) {
                // Create lightweight message objects (avoid dependency on undefined Message class)
                const userMsg = { agentId, role: 'user', content: userMessage, timestamp };
                const aiMsg = { agentId, role: 'assistant', content: aiResponse, timestamp };

                // Get or create memory instance (best-effort). Don't require it for upload.
                const memory = this.getMemory(agentId);
                if (memory) {
                    memory.add(userMsg);
                    memory.add(aiMsg);
                }

                // Upload to hub (attempt regardless of memory instance)
                const data = {
                    agent_id: agentId,
                    messages: [
                        { role: 'user', content: userMessage, timestamp },
                        { role: 'assistant', content: aiResponse, timestamp }
                    ],
                    timestamp
                };

                try {
                    // Push a placeholder into the operation queue before attempting upload.
                    // If upload succeeds, remove the placeholder; if it fails, leave it for retry.
                    const queueEntry = { type: 'uploadHub', args: [this.account, `conversation_${agentId}_${Date.now()}`, JSON.stringify(data), null, false] };
                    this.operationQueue.push(queueEntry);

                    await this.storage.uploadHub(
                        this.account,
                        `conversation_${agentId}_${Date.now()}`,
                        JSON.stringify(data),
                        null,
                        false  // Queue for async upload
                    );

                    // Upload succeeded — remove the placeholder entry we added
                    const idx = this.operationQueue.indexOf(queueEntry);
                    if (idx !== -1) this.operationQueue.splice(idx, 1);

                    logger.info('Conversation stored to hub', { agentId, timestamp });
                    return { success: true, stored: true, agent_id: agentId };
                } catch (uploadErr) {
                    // Leave queue entry for retry and log
                    logger.warn('Upload failed - queued operation', { agentId, error: uploadErr.message });
                    return { success: false, queued: true, agent_id: agentId };
                }
            }

            // Fallback to in-memory storage
            const uniqueKey = `${agentId}_${timestamp}_${Date.now()}`;
            return this.fallbackStore('conversations', uniqueKey, {
                agent_id: agentId,
                user_message: userMessage,
                ai_response: aiResponse,
                timestamp,
                created_at: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Store conversation error:', error.message);
            const uniqueKey = `${agentId}_${timestamp}_${Date.now()}`;
            return this.fallbackStore('conversations', uniqueKey, {
                agent_id: agentId,
                user_message: userMessage,
                ai_response: aiResponse,
                timestamp,
                created_at: new Date().toISOString()
            });
        }
    }

    /**
     * Get conversation history
     * @param {string} agentId - Agent identifier
     * @param {number} limit - Number of messages to retrieve
     * @returns {Promise<Array>} Conversation history
     */
    async getConversationHistory(agentId, limit = 50) {
        try {
            if (this.isConnected && this.storage) {
                // Try to get conversation from hub
                const conversation = await this.storage.getConversation(this.account, agentId);

                if (conversation && conversation.length > 0) {
                    logger.info('Retrieved conversation history from hub', { agentId, count: conversation.length });
                    return conversation.slice(-limit);  // Return last N messages
                }

                // Try to get from memory instance
                const memory = this.getMemory(agentId);
                if (memory && memory.size() > 0) {
                    const messages = memory.get(limit);
                    logger.info('Retrieved conversation from memory instance', { agentId, count: messages.length });
                    return messages;
                }
            }

            // Fallback to in-memory storage
            return this.fallbackQuery('conversations', agentId, limit);

        } catch (error) {
            logger.error('Get conversation history error:', error.message);
            return this.fallbackQuery('conversations', agentId, limit);
        }
    }

    /**
     * Store user preference
     * @param {string} userId - User identifier
     * @param {string} key - Preference key
     * @param {any} value - Preference value
     * @returns {Promise<Object>} Storage result
     */
    async storeUserPreference(userId, key, value) {
        try {
            if (this.isConnected && this.storage) {
                const data = {
                    user_id: userId,
                    key,
                    value,
                    updated_at: new Date().toISOString()
                };

                await this.storage.uploadHub(
                    this.account,
                    `preference_${userId}_${key}`,
                    JSON.stringify(data),
                    null,
                    false
                );

                logger.info('User preference stored', { userId, key });
                return { success: true, stored: true, user_id: userId, key };
            }

            // Fallback
            return this.fallbackStore('preferences', `${userId}:${key}`, {
                user_id: userId,
                key,
                value,
                updated_at: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Store user preference error:', error.message);
            return this.fallbackStore('preferences', `${userId}:${key}`, {
                user_id: userId,
                key,
                value,
                updated_at: new Date().toISOString()
            });
        }
    }

    /**
     * Get user preferences
     * @param {string} userId - User identifier
     * @returns {Promise<Object>} User preferences
     */
    async getUserPreferences(userId) {
        try {
            if (this.isConnected && this.storage) {
                // List all preference files for user
                const conversations = await this.storage.listConversations(this.account);
                const preferenceFiles = conversations.filter(conv =>
                    conv.startsWith(`preference_${userId}_`)
                );

                const preferences = {};
                for (const file of preferenceFiles) {
                    try {
                        const data = await this.storage.downloadHub(this.account, file);
                        if (data) {
                            const parsed = JSON.parse(
                                data instanceof ArrayBuffer ? new TextDecoder().decode(data) : data.toString()
                            );
                            preferences[parsed.key] = parsed.value;
                        }
                    } catch (err) {
                        logger.warn('Failed to parse preference file', { file, error: err.message });
                    }
                }

                logger.info('Retrieved user preferences', { userId, count: Object.keys(preferences).length });
                return preferences;
            }

            // Fallback
            const fallbackPrefs = {};
            for (const [key, value] of this.fallbackStorage.preferences.entries()) {
                // Support both `user:key` and `user_key` separators
                if (key.startsWith(`${userId}:`) || key.startsWith(`${userId}_`)) {
                    const sep = key.includes(':') ? ':' : '_';
                    const prefKey = key.split(sep)[1];
                    fallbackPrefs[prefKey] = value.value;
                }
            }
            return fallbackPrefs;

        } catch (error) {
            logger.error('Get user preferences error:', error.message);
            return {};
        }
    }

    /**
     * Store transaction log
     * @param {Object} transaction - Transaction data
     * @returns {Promise<Object>} Storage result
     */
    async storeTransaction(transaction) {
        const data = {
            ...transaction,
            stored_at: new Date().toISOString()
        };

        try {
            if (this.isConnected && this.storage) {
                await this.storage.uploadHub(
                    this.account,
                    `transaction_${transaction.tx_hash || Date.now()}`,
                    JSON.stringify(data),
                    null,
                    false
                );

                logger.info('Transaction stored', { tx_hash: transaction.tx_hash });
                return { success: true, stored: true, tx_hash: transaction.tx_hash };
            }

            // Fallback
            return this.fallbackStore('transactions', transaction.tx_hash || `tx_${Date.now()}`, data);

        } catch (error) {
            logger.error('Store transaction error:', error.message);
            return this.fallbackStore('transactions', transaction.tx_hash || `tx_${Date.now()}`, data);
        }
    }

    /**
     * Get transaction log
     * @param {string} agentId - Agent identifier
     * @param {number} limit - Number of transactions to retrieve
     * @returns {Promise<Array>} Transaction log
     */
    async getTransactionLog(agentId, limit = 100) {
        try {
            if (this.isConnected && this.storage) {
                const conversations = await this.storage.listConversations(this.account);
                const transactionFiles = conversations.filter(conv => conv.startsWith('transaction_'));

                const transactions = [];
                for (const file of transactionFiles.slice(-limit)) {
                    try {
                        const data = await this.storage.downloadHub(this.account, file);
                        if (data) {
                            const parsed = JSON.parse(
                                data instanceof ArrayBuffer ? new TextDecoder().decode(data) : data.toString()
                            );
                            if (!agentId || parsed.agent_id === agentId) {
                                transactions.push(parsed);
                            }
                        }
                    } catch (err) {
                        logger.warn('Failed to parse transaction file', { file, error: err.message });
                    }
                }

                logger.info('Retrieved transaction log', { agentId, count: transactions.length });
                return transactions;
            }

            // Fallback
            return this.fallbackQuery('transactions', agentId, limit);

        } catch (error) {
            logger.error('Get transaction log error:', error.message);
            return this.fallbackQuery('transactions', agentId, limit);
        }
    }

    /**
     * Store contract template
     * @param {string} name - Template name
     * @param {string} code - Contract code
     * @param {Object} metadata - Template metadata
     * @returns {Promise<Object>} Storage result
     */
    async storeContractTemplate(name, code, metadata = {}) {
        const data = {
            name,
            code,
            metadata,
            created_at: new Date().toISOString()
        };

        try {
            if (this.isConnected && this.storage) {
                await this.storage.uploadHub(
                    this.account,
                    `contract_template_${name}`,
                    JSON.stringify(data),
                    null,
                    false
                );

                logger.info('Contract template stored', { name });
                return { success: true, stored: true, name };
            }

            // Fallback
            return this.fallbackStore('contracts', name, data);

        } catch (error) {
            logger.error('Store contract template error:', error.message);
            return this.fallbackStore('contracts', name, data);
        }
    }

    /**
     * Get contract template
     * @param {string} name - Template name
     * @returns {Promise<Object>} Contract template
     */
    async getContractTemplate(name) {
        try {
            if (this.isConnected && this.storage) {
                const data = await this.storage.downloadHub(this.account, `contract_template_${name}`);
                if (data) {
                    const parsed = JSON.parse(
                        data instanceof ArrayBuffer ? new TextDecoder().decode(data) : data.toString()
                    );
                    logger.info('Retrieved contract template', { name });
                    return parsed;
                }
            }

            // Fallback
            const template = this.fallbackStorage.contracts.get(name);
            if (!template) {
                // Return null when template not found to make callers handle absence gracefully
                logger.info(`Contract template '${name}' not found in fallback storage`);
                return null;
            }
            return template;

        } catch (error) {
            logger.error('Get contract template error:', error.message);
            throw error;
        }
    }

    /**
     * Generic store wrapper to support simple storage calls like store(collection, data)
     * or store(collection, key, data). This keeps compatibility with services that
     * expect a simple `store` API (eg. AuditService).
     */
    async store(collection, keyOrData, data) {
        let key;
        let payload;
        try {
            if (data === undefined) {
                // Called as store(collection, data)
                payload = keyOrData;
                key = (payload && (payload.id || payload.tx_hash || payload.name)) || `${collection}_${Date.now()}`;
            } else {
                // Called as store(collection, key, data)
                key = keyOrData;
                payload = data;
            }

            if (this.isConnected && this.storage) {
                await this.storage.uploadHub(
                    this.account,
                    `${collection}_${key}`,
                    JSON.stringify(payload),
                    null,
                    false
                );

                logger.info('Generic store uploaded to hub', { collection, key });
                return { success: true, stored: true, key };
            }

            // Fallback
            return this.fallbackStore(collection, key, payload);

        } catch (error) {
            logger.error('Generic store error:', error.message);
            // Ensure fallback on error
            return this.fallbackStore(collection, key || `${collection}_${Date.now()}`, payload || keyOrData);
        }
    }

    /**
     * Query memory with filters
     * @param {string} collection - Collection name
     * @param {Object} filters - Query filters
     * @param {number} limit - Result limit
     * @returns {Promise<Array>} Query results
     */
    async queryMemory(collection, filters = {}, limit = 100) {
        try {
            if (this.isConnected && this.storage) {
                const conversations = await this.storage.listConversations(this.account);
                const files = conversations.filter(conv => conv.startsWith(`${collection}_`));

                const results = [];
                for (const file of files.slice(-limit)) {
                    try {
                        const data = await this.storage.downloadHub(this.account, file);
                        if (data) {
                            const parsed = JSON.parse(
                                data instanceof ArrayBuffer ? new TextDecoder().decode(data) : data.toString()
                            );

                            // Apply filters
                            let matches = true;
                            for (const [key, value] of Object.entries(filters)) {
                                if (parsed[key] !== value) {
                                    matches = false;
                                    break;
                                }
                            }

                            if (matches) {
                                results.push(parsed);
                            }
                        }
                    } catch (err) {
                        logger.warn('Failed to parse file during query', { file, error: err.message });
                    }
                }

                logger.info('Query completed', { collection, count: results.length });
                return results;
            }

            // Fallback
            return this.fallbackQuery(collection, filters.agent_id, limit);

        } catch (error) {
            logger.error('Query memory error:', error.message);
            return [];
        }
    }

    /**
     * Get storage statistics
     * @returns {Object} Storage stats
     */
    getStats() {
        const stats = {
            isConnected: this.isConnected,
            hubUrl: this.hubUrl,
            membaseId: this.membaseId,
            account: this.account,
            memoryInstances: this.memories.size,
            usesFallback: this.usesFallback,
            fallbackCounts: {
                conversations: this.fallbackStorage.conversations.size,
                preferences: this.fallbackStorage.preferences.size,
                transactions: this.fallbackStorage.transactions.size,
                contracts: this.fallbackStorage.contracts.size
            },
            // Add expected fields for frontend
            conversationCount: this.memories.size + this.fallbackStorage.conversations.size, // Approximation
            messageCount: 0, // Will calculate below
            storageSize: '0 KB'
        };

        // Calculate message count from memories
        let totalMessages = 0;
        for (const memory of this.memories.values()) {
            if (memory.messages) {
                totalMessages += memory.messages.length;
            } else if (memory.get) {
                // specific to BufferedMemory implementation
                try {
                    totalMessages += memory.get(1000).length;
                } catch (e) { }
            }
        }

        // Add fallback messages (rough estimate logic as fallback stores key-value)
        // Adjust based on actual fallback structure if needed. 
        // Based on fallbackStore code: this.fallbackStorage.conversations.set(key, data);
        // data usually contains messages or is a message? 
        // fallbackStore('conversations', agentId, {...}) stores the last message context usually or the whole conv?
        // Looking at storeConversation: fallbackStore stores a single object with user_message and ai_response.
        // So each entry in fallbackStorage.conversations is effectively 2 messages (user + AI).
        totalMessages += (this.fallbackStorage.conversations.size * 2);

        stats.messageCount = totalMessages;
        stats.storageSize = `${(JSON.stringify(stats).length / 1024).toFixed(2)} KB`; // Rough estimate


        if (this.isConnected && this.storage) {
            const status = this.storage.getStatus();
            stats.hubStatus = {
                queueLength: status.queueLength,
                isProcessing: status.isProcessing
            };
        }

        // Add legacy/snake_case fields expected by tests and older callers
        stats.uses_fallback = stats.usesFallback;
        stats.queued_operations = this.operationQueue ? this.operationQueue.length : 0;
        stats.fallback_storage = {
            conversations: this.fallbackStorage.conversations.size,
            preferences: this.fallbackStorage.preferences.size,
            transactions: this.fallbackStorage.transactions.size,
            contracts: this.fallbackStorage.contracts.size
        };

        return stats;
    }

    /**
     * Wait for upload queue to complete
     * @returns {Promise<void>}
     */
    async waitForUploadQueue() {
        if (this.isConnected && this.storage) {
            await this.storage.waitForUploadQueue();
            logger.info('Upload queue completed');
        }
    }

    /**
     * Close storage connections
     */
    close() {
        if (this.storage) {
            this.storage.close();
            logger.info('Membase storage closed');
        }
    }

    /**
     * Fallback storage operations
     */
    fallbackStore(collection, key, data) {
        if (!this.fallbackStorage[collection]) {
            this.fallbackStorage[collection] = new Map();
        }
        this.fallbackStorage[collection].set(key, data);
        this.saveToDisk();
        this.usesFallback = true;
        logger.debug('Data stored in fallback', { collection, key });
        return { success: true, stored: true, fallback: true };
    }

    /**
     * Generic store helper to support older callers like membaseService.store(collection, data)
     * or store(collection, key, data)
     */
    async store(collection, keyOrData, data) {
        try {
            let key = null;
            let payload = null;

            if (data === undefined) {
                // Called as store(collection, data)
                payload = keyOrData;
                key = `${collection}_${Date.now()}`;
            } else {
                // Called as store(collection, key, data)
                key = keyOrData;
                payload = data;
            }

            if (this.isConnected && this.storage) {
                try {
                    await this.storage.uploadHub(this.account, key, JSON.stringify(payload), null, false);
                    return { success: true, stored: true, key };
                } catch (err) {
                    if (err.response && err.response.status === 429) {
                        this.operationQueue.push({ type: 'uploadHub', args: [this.account, key, JSON.stringify(payload), null, false] });
                        return { success: false, queued: true, key };
                    }
                    throw err;
                }
            }

            // Fallback
            return this.fallbackStore(collection, key, payload);
        } catch (error) {
            logger.error('Generic store error:', error.message);
            return this.fallbackStore(collection, key || `${collection}_${Date.now()}`, data || keyOrData);
        }
    }

    fallbackQuery(collection, agentId, limit) {
        const results = [];
        // Handle case where collection might not exist in fallbackStorage yet
        if (this.fallbackStorage[collection]) {
            for (const [key, value] of this.fallbackStorage[collection].entries()) {
                if (!agentId || key.includes(agentId) || (value && value.agent_id === agentId)) {
                    results.push(value);
                }
            }
        }
        return results.slice(-limit);
    }
}

module.exports = new MembaseService();
