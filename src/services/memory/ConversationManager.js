const membaseService = require('./MembaseService');
const logger = require('../../utils/logger');

class ConversationManager {
    constructor() {
        this.activeConversations = new Map();
        this.maxContextMessages = 20; // Maximum messages to include in context
    }

    /**
     * Initialize new conversation
     * @param {string} agentId - Agent identifier
     * @param {string} userId - User identifier
     * @returns {Promise<Object>} Conversation info
     */
    async initializeConversation(agentId, userId) {
        try {
            const conversation = {
                agent_id: agentId,
                user_id: userId,
                started_at: new Date().toISOString(),
                message_count: 0,
                last_activity: new Date().toISOString()
            };

            this.activeConversations.set(agentId, conversation);

            logger.info('Conversation initialized', { agentId, userId });

            return {
                success: true,
                agent_id: agentId,
                user_id: userId,
                started_at: conversation.started_at
            };
        } catch (error) {
            logger.error('Initialize conversation error:', error.message);
            throw new Error(`Failed to initialize conversation: ${error.message}`);
        }
    }

    /**
     * Add message to conversation
     * @param {string} agentId - Agent identifier
     * @param {string} message - Message content
     * @param {string} role - Message role (user/assistant/system)
     * @param {Object} metadata - Additional metadata
     * @returns {Promise<Object>} Message info
     */
    async addMessage(agentId, message, role = 'user', metadata = {}) {
        try {
            const timestamp = new Date().toISOString();

            // Store based on role
            if (role === 'user') {
                // Store as user message, AI response will be added later
                const conversation = this.activeConversations.get(agentId) || {
                    agent_id: agentId,
                    message_count: 0
                };

                conversation.last_user_message = message;
                conversation.last_activity = timestamp;
                this.activeConversations.set(agentId, conversation);

                logger.info('User message added', { agentId, role });

                return {
                    success: true,
                    agent_id: agentId,
                    role,
                    message,
                    timestamp,
                    metadata
                };
            } else if (role === 'assistant') {
                // Store complete conversation turn
                const conversation = this.activeConversations.get(agentId);

                if (conversation && conversation.last_user_message) {
                    await membaseService.storeConversation(
                        agentId,
                        conversation.last_user_message,
                        message,
                        timestamp
                    );

                    conversation.message_count += 1;
                    conversation.last_activity = timestamp;
                    delete conversation.last_user_message;
                    this.activeConversations.set(agentId, conversation);

                    logger.info('Assistant message stored', { agentId, messageCount: conversation.message_count });

                    return {
                        success: true,
                        agent_id: agentId,
                        role,
                        message,
                        timestamp,
                        metadata
                    };
                }
            }

            return {
                success: true,
                agent_id: agentId,
                role,
                message,
                timestamp
            };
        } catch (error) {
            logger.error('Add message error:', error.message);
            throw new Error(`Failed to add message: ${error.message}`);
        }
    }

    /**
     * Get conversation context for AI
     * @param {string} agentId - Agent identifier
     * @param {number} messagesToInclude - Number of recent messages to include
     * @returns {Promise<Array>} Context messages
     */
    async getContext(agentId, messagesToInclude = 10) {
        try {
            const history = await membaseService.getConversationHistory(
                agentId,
                Math.min(messagesToInclude, this.maxContextMessages)
            );

            // Convert to messages format for AI
            const messages = [];

            for (const entry of history.reverse()) {
                messages.push({
                    role: 'user',
                    content: entry.user_message
                });
                messages.push({
                    role: 'assistant',
                    content: entry.ai_response
                });
            }

            logger.info('Context retrieved', { agentId, messageCount: messages.length });

            return messages;
        } catch (error) {
            logger.error('Get context error:', error.message);
            return [];
        }
    }

    /**
     * Summarize conversation for storage
     * @param {string} agentId - Agent identifier
     * @returns {Promise<Object>} Conversation summary
     */
    async summarizeConversation(agentId) {
        try {
            const history = await membaseService.getConversationHistory(agentId, 100);

            if (history.length === 0) {
                return {
                    agent_id: agentId,
                    message_count: 0,
                    summary: 'No conversation history'
                };
            }

            const firstMessage = history[history.length - 1];
            const lastMessage = history[0];

            const summary = {
                agent_id: agentId,
                message_count: history.length,
                started_at: firstMessage.timestamp,
                last_activity: lastMessage.timestamp,
                duration_minutes: this.calculateDuration(firstMessage.timestamp, lastMessage.timestamp),
                topics: this.extractTopics(history),
                user_questions: history.filter(h => h.user_message.includes('?')).length,
                ai_responses: history.length
            };

            logger.info('Conversation summarized', { agentId, messageCount: summary.message_count });

            return summary;
        } catch (error) {
            logger.error('Summarize conversation error:', error.message);
            throw new Error(`Failed to summarize conversation: ${error.message}`);
        }
    }

    /**
     * Clear old conversations
     * @param {string} agentId - Agent identifier
     * @param {number} days - Days to keep
     * @returns {Promise<Object>} Cleanup result
     */
    async clearOldConversations(agentId, days = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const history = await membaseService.getConversationHistory(agentId, 1000);

            const toKeep = history.filter(entry =>
                new Date(entry.timestamp) > cutoffDate
            );

            const removed = history.length - toKeep.length;

            logger.info('Old conversations cleared', {
                agentId,
                removed,
                kept: toKeep.length,
                cutoffDays: days
            });

            return {
                success: true,
                agent_id: agentId,
                removed_count: removed,
                kept_count: toKeep.length,
                cutoff_date: cutoffDate.toISOString()
            };
        } catch (error) {
            logger.error('Clear old conversations error:', error.message);
            throw new Error(`Failed to clear old conversations: ${error.message}`);
        }
    }

    /**
     * Get conversation statistics
     * @param {string} agentId - Agent identifier
     * @returns {Promise<Object>} Conversation stats
     */
    async getConversationStats(agentId) {
        try {
            const history = await membaseService.getConversationHistory(agentId, 1000);

            if (history.length === 0) {
                return {
                    agent_id: agentId,
                    total_messages: 0,
                    active: false
                };
            }

            const firstMessage = history[history.length - 1];
            const lastMessage = history[0];
            const now = new Date();
            const lastActivity = new Date(lastMessage.timestamp);
            const minutesSinceLastActivity = (now - lastActivity) / 1000 / 60;

            return {
                agent_id: agentId,
                total_messages: history.length,
                first_message: firstMessage.timestamp,
                last_message: lastMessage.timestamp,
                minutes_since_last_activity: Math.floor(minutesSinceLastActivity),
                active: minutesSinceLastActivity < 30, // Active if within 30 minutes
                average_response_length: this.calculateAverageLength(history)
            };
        } catch (error) {
            logger.error('Get conversation stats error:', error.message);
            throw new Error(`Failed to get conversation stats: ${error.message}`);
        }
    }

    /**
     * Build full conversation for export
     * @param {string} agentId - Agent identifier
     * @returns {Promise<Object>} Full conversation
     */
    async exportConversation(agentId) {
        try {
            const history = await membaseService.getConversationHistory(agentId, 1000);
            const summary = await this.summarizeConversation(agentId);

            return {
                agent_id: agentId,
                summary,
                messages: history.reverse(), // Chronological order
                exported_at: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Export conversation error:', error.message);
            throw new Error(`Failed to export conversation: ${error.message}`);
        }
    }

    /**
     * Calculate conversation duration in minutes
     * @param {string} startTime - Start timestamp
     * @param {string} endTime - End timestamp
     * @returns {number} Duration in minutes
     */
    calculateDuration(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        return Math.floor((end - start) / 1000 / 60);
    }

    /**
     * Extract topics from conversation
     * @param {Array} history - Conversation history
     * @returns {Array} Extracted topics
     */
    extractTopics(history) {
        const topics = new Set();
        const keywords = ['contract', 'token', 'swap', 'transfer', 'deploy', 'audit', 'security'];

        for (const entry of history) {
            const text = `${entry.user_message} ${entry.ai_response}`.toLowerCase();
            keywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    topics.add(keyword);
                }
            });
        }

        return Array.from(topics);
    }

    /**
     * Calculate average response length
     * @param {Array} history - Conversation history
     * @returns {number} Average length
     */
    calculateAverageLength(history) {
        if (history.length === 0) return 0;

        const totalLength = history.reduce((sum, entry) =>
            sum + entry.ai_response.length, 0
        );

        return Math.floor(totalLength / history.length);
    }

    /**
     * Get active conversation info
     * @param {string} agentId - Agent identifier
     * @returns {Object|null} Active conversation
     */
    getActiveConversation(agentId) {
        return this.activeConversations.get(agentId) || null;
    }

    /**
     * End conversation
     * @param {string} agentId - Agent identifier
     * @returns {Promise<Object>} End result
     */
    async endConversation(agentId) {
        try {
            const conversation = this.activeConversations.get(agentId);

            if (conversation) {
                const summary = await this.summarizeConversation(agentId);
                this.activeConversations.delete(agentId);

                logger.info('Conversation ended', { agentId });

                return {
                    success: true,
                    agent_id: agentId,
                    summary
                };
            }

            return {
                success: false,
                message: 'No active conversation found'
            };
        } catch (error) {
            logger.error('End conversation error:', error.message);
            throw new Error(`Failed to end conversation: ${error.message}`);
        }
    }
}

module.exports = new ConversationManager();
