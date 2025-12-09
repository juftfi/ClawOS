const axios = require('axios');
const logger = require('../../utils/logger');

class LLMService {
    constructor() {
        this.apiUrl = process.env.CHAINGPT_API_URL || 'https://api.chaingpt.org';
        this.apiKey = process.env.CHAINGPT_API_KEY;
        this.defaultModel = 'general_assistant';
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
    }

    /**
     * Send a chat message to ChainGPT
     * @param {string} prompt - User prompt
     * @param {string} model - Model to use (default: gpt-4)
     * @param {string} systemMessage - System message for context
     * @returns {Promise<Object>} Response with text, tokens, and model
     */
    async chat(prompt, model = this.defaultModel, systemMessage = null) {
        try {
            const cacheKey = `chat:${prompt}:${model}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                logger.info('Returning cached response');
                return cached;
            }

            // Support both ChainGPT 'question' style and OpenAI-like 'messages' style.
            const messages = [];
            if (systemMessage) messages.push({ role: 'system', content: systemMessage });
            messages.push({ role: 'user', content: prompt });

            const response = await this.makeRequest('/chat/completions', {
                model,
                messages
            });

            const result = {
                response: response.answer || (typeof response === 'string' ? response : JSON.stringify(response)),
                tokens_used: response.creditsUsed || response.credits_used || 1,
                model_used: model,
                finish_reason: response.finish_reason || 'stop'
            };

            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            logger.error('ChainGPT chat error:', error.message);
            return this.getFallbackResponse('chat', error);
        }
    }

    /**
     * Analyze smart contract code
     * @param {string} contractCode - Solidity contract code
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeContract(contractCode) {
        try {
            const cacheKey = `analyze:${this.hashCode(contractCode)}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const systemMessage = 'You are a smart contract analysis expert. Analyze the provided Solidity code and provide insights on functionality, gas optimization, and potential improvements.';
            const prompt = `Analyze this smart contract:\n\n${contractCode}\n\nProvide:\n1. Contract purpose and functionality\n2. Key functions and their roles\n3. Gas optimization suggestions\n4. Code quality assessment\n5. Potential improvements`;

            const response = await this.chat(prompt, this.defaultModel, systemMessage);

            const result = {
                ...response,
                analysis_type: 'contract_analysis',
                contract_length: contractCode.length
            };

            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            logger.error('Contract analysis error:', error.message);
            return this.getFallbackResponse('analyze', error);
        }
    }

    /**
     * Generate smart contract from description
     * @param {string} description - Contract description
     * @returns {Promise<Object>} Generated contract code
     */
    async generateSmartContract(description) {
        try {
            const systemMessage = 'You are a Solidity smart contract developer. Generate secure, optimized, and well-documented smart contracts based on user requirements. Always include SPDX license and pragma statements.';
            const prompt = `Generate a Solidity smart contract with the following requirements:\n\n${description}\n\nRequirements:\n- Use Solidity 0.8.0 or higher\n- Include proper error handling\n- Add comprehensive comments\n- Follow best practices\n- Include events for important state changes\n\nProvide only the contract code.`;

            const response = await this.chat(prompt, this.defaultModel, systemMessage);

            return {
                ...response,
                generation_type: 'smart_contract',
                description
            };
        } catch (error) {
            logger.error('Contract generation error:', error.message);
            return this.getFallbackResponse('generate', error);
        }
    }

    /**
     * Explain blockchain transaction
     * @param {Object} txData - Transaction data
     * @returns {Promise<Object>} Transaction explanation
     */
    async explainTransaction(txData) {
        try {
            const txString = typeof txData === 'string' ? txData : JSON.stringify(txData, null, 2);
            const cacheKey = `explain:${this.hashCode(txString)}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const systemMessage = 'You are a blockchain transaction expert. Explain transactions in simple, clear language that non-technical users can understand.';
            const prompt = `Explain this blockchain transaction:\n\n${txString}\n\nProvide:\n1. What this transaction does\n2. Who is involved (sender/receiver)\n3. Value transferred\n4. Gas costs and why\n5. Any special functions called`;

            const response = await this.chat(prompt, this.defaultModel, systemMessage);

            const result = {
                ...response,
                explanation_type: 'transaction',
                transaction_data: txData
            };

            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            logger.error('Transaction explanation error:', error.message);
            return this.getFallbackResponse('explain', error);
        }
    }

    /**
     * Multi-turn conversation with context
     * @param {Array} messages - Array of {role, content} messages
     * @param {string} model - Model to use
     * @returns {Promise<Object>} Response
     */
    async conversation(messages, model = this.defaultModel, sdkUniqueId = null) {
        try {
            if (!Array.isArray(messages) || messages.length === 0) {
                throw new Error('Messages must be a non-empty array');
            }

            // Convert messages array to single question with chat history enabled
            const question = messages[messages.length - 1].content;
            // Build messages payload for OpenAI-like API
            const payload = { model, messages };
            if (sdkUniqueId) payload.sdkUniqueId = sdkUniqueId;

            const response = await this.makeRequest('/chat/completions', payload);

            return {
                response: response.answer || (typeof response === 'string' ? response : JSON.stringify(response)),
                tokens_used: response.creditsUsed || response.credits_used || 1,
                model_used: model,
                finish_reason: response.finish_reason || 'stop',
                conversation_length: messages.length
            };
        } catch (error) {
            logger.error('Conversation error:', error.message);
            return this.getFallbackResponse('conversation', error);
        }
    }

    /**
     * Make API request to ChainGPT
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data
     * @returns {Promise<Object>} API response
     */
    async makeRequest(endpoint, data) {
        const url = `${this.apiUrl}${endpoint}`;

        logger.debug(`ChainGPT API request to ${endpoint}`);

        try {
            const response = await axios.post(url, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                timeout: 30000
            });

            const d = response.data;

            // Normalize various response shapes (ChainGPT, OpenAI-like, or raw strings)
            try {
                // If ChainGPT 'answer' shape
                if (d && typeof d === 'object' && typeof d.answer === 'string') {
                    return {
                        answer: d.answer,
                        creditsUsed: d.creditsUsed || d.usage?.total_tokens || 0,
                        finish_reason: d.finish_reason || null,
                        raw: d
                    };
                }

                // OpenAI-like response
                if (d && typeof d === 'object' && Array.isArray(d.choices) && d.choices.length > 0) {
                    const first = d.choices[0];
                    const text = first.text || (first.message && first.message.content) || '';
                    return {
                        answer: text,
                        creditsUsed: d.usage?.total_tokens || d.creditsUsed || 0,
                        finish_reason: first.finish_reason || d.finish_reason || null,
                        raw: d
                    };
                }

                // If the API returned a simple string
                if (typeof d === 'string') {
                    return { answer: d, creditsUsed: 0, finish_reason: null, raw: d };
                }

                // Unknown shape: return it under raw and provide a JSON string as answer
                return { answer: JSON.stringify(d), creditsUsed: d.usage?.total_tokens || 0, finish_reason: null, raw: d };
            } catch (normErr) {
                logger.warn('Failed to normalize ChainGPT response', normErr.message);
                return { answer: JSON.stringify(d), creditsUsed: 0, finish_reason: null, raw: d };
            }
        } catch (error) {
            if (error.response?.status === 429) {
                logger.warn('ChainGPT rate limit hit');
                throw new Error('Rate limit exceeded. Please try again later.');
            }

            if (error.response?.status === 401) {
                logger.error('ChainGPT authentication failed');
                throw new Error('Invalid API key');
            }

            throw error;
        }
    }

    /**
     * Get cached response
     * @param {string} key - Cache key
     * @returns {Object|null} Cached data or null
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        if (cached) {
            this.cache.delete(key);
        }
        return null;
    }

    /**
     * Set cache
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Generate hash code for string
     * @param {string} str - String to hash
     * @returns {number} Hash code
     */
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }

    /**
     * Get fallback response on error
     * @param {string} type - Request type
     * @param {Error} error - Error object
     * @returns {Object} Fallback response
     */
    getFallbackResponse(type, error) {
        const fallbacks = {
            chat: 'I apologize, but I am currently unable to process your request. Please try again later.',
            analyze: 'Contract analysis is temporarily unavailable. Please ensure your contract code is valid Solidity and try again.',
            generate: 'Contract generation is temporarily unavailable. Please try again later.',
            explain: 'Transaction explanation is temporarily unavailable. Please verify the transaction data and try again.',
            conversation: 'I apologize, but I am currently unable to continue this conversation. Please try again later.'
        };

        return {
            response: fallbacks[type] || 'Service temporarily unavailable.',
            tokens_used: 0,
            model_used: 'fallback',
            error: error.message,
            is_fallback: true
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        logger.info('LLM cache cleared');
    }
}

module.exports = new LLMService();
