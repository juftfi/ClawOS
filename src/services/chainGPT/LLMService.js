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
            logger.error('ChainGPT Chat error:', error.message);
            return {
                response: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a moment.",
                tokens_used: 0,
                model_used: model,
                finish_reason: 'error',
                error: error.message
            };
        }
    }

    /**
     * Analyze smart contract code
     * @param {string} contractCode - Solidity contract code
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeContract(contractCode) {
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
    }

    /**
     * Generate smart contract from description
     * @param {string} description - Contract description
     * @returns {Promise<Object>} Generated contract code
     */
    async generateSmartContract(description) {
        const systemMessage = 'You are a Solidity smart contract developer. Generate secure, optimized, and well-documented smart contracts based on user requirements. Always include SPDX license and pragma statements.';
        const prompt = `Generate a Solidity smart contract with the following requirements:\n\n${description}\n\nRequirements:\n- Use Solidity 0.8.0 or higher\n- Include proper error handling\n- Add comprehensive comments\n- Follow best practices\n- Include events for important state changes\n\nProvide only the contract code.`;

        const response = await this.chat(prompt, this.defaultModel, systemMessage);

        return {
            ...response,
            generation_type: 'smart_contract',
            description
        };
    }

    /**
     * Explain blockchain transaction
     * @param {Object} txData - Transaction data
     * @returns {Promise<Object>} Transaction explanation
     */
    async explainTransaction(txData) {
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
    }

    /**
     * Multi-turn conversation with context
     * @param {Array} messages - Array of {role, content} messages
     * @param {string} model - Model to use
     * @returns {Promise<Object>} Response
     */
    async conversation(messages, model = this.defaultModel, sdkUniqueId = null) {
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
    }

    async getMarketNarrative(token = null) {
        const cacheKey = `narrative:${token || 'global'}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const prompt = token
            ? `Analyze the current market narrative for ${token}. Include bullish/bearish sentiment, on-chain flows, and recent news context.`
            : `Analyze the current global crypto market narrative. Identify the top 3 dominating narratives, fear/greed status, and major liquidations.`;

        const systemMessage = 'You are the ChainGPT Hub V2 Market Narrative engine. Provide clear, data-driven alerts on crypto narratives.';
        // Use defaultModel to ensure API compatibility
        const response = await this.chat(prompt, this.defaultModel, systemMessage);

        const result = {
            ...response,
            type: 'market_narrative',
            token: token || 'GLOBAL',
            timestamp: new Date().toISOString()
        };

        this.setCache(cacheKey, result);
        return result;
    }

    /**
     * Get AI Trading Assistant Insights (Liquidation Heatmaps)
     * @param {string} token - Token to analyze
     * @returns {Promise<Object>} Trading projections and heatmap data
     */
    async getTradingAssistant(token) {
        const prompt = `Generate a predictive trading report for ${token}. Include:
1. Liquidation Heatmap levels
2. Improving pattern projections
3. Volume metric assessment
4. Price target projections (Short/Medium term)`;

        const systemMessage = 'You are the ChainGPT Hub V2 AI Trading Assistant. Provide high-fidelity price projections and liquidation levels.';
        // Use defaultModel to ensure API compatibility
        const response = await this.chat(prompt, this.defaultModel, systemMessage);

        return {
            ...response,
            type: 'trading_report',
            token,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get Real-time Web3 News (Hub V2 Integration)
     * @param {string} query - Optional search query
     * @returns {Promise<Object>} Curated news feed
     */
    async getWeb3News(query = 'latest') {
        try {
            const response = await this.makeRequest('/news/latest', { query });
            return {
                news: response.answer || [],
                source: 'ChainGPT Hub V2 News Feed',
                query,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            if (error.response?.status === 404) {
                logger.info('Falling back to /v1/hub/news for ChainGPT news');
                try {
                    const response = await this.makeRequest('/v1/hub/news', { query });
                    return {
                        news: response.answer || [],
                        source: 'ChainGPT Hub V2 News Feed (v1)',
                        query,
                        timestamp: new Date().toISOString()
                    };
                } catch (v1Error) {
                    logger.info('Falling back to /api/news/latest for ChainGPT news');
                    const response = await this.makeRequest('/api/news/latest', { query });
                    return {
                        news: response.answer || [],
                        source: 'ChainGPT Hub V2 News Feed (api)',
                        query,
                        timestamp: new Date().toISOString()
                    };
                }
            }
            throw error;
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
        logger.info(`ChainGPT API request: ${endpoint}`);

        try {
            const response = await axios.post(url, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                timeout: 30000
            });

            return this.normalizeResponse(response.data);
        } catch (error) {
            logger.warn(`ChainGPT primary request failed: ${endpoint}`, error.message);

            // Fallback for 404
            if (error.response?.status === 404 && !url.includes('/v1')) {
                const altUrl = `${this.apiUrl}/v1${endpoint}`;
                try {
                    const retryResp = await axios.post(altUrl, data, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.apiKey}`
                        },
                        timeout: 30000
                    });
                    return this.normalizeResponse(retryResp.data);
                } catch (retryErr) {
                    logger.error(`ChainGPT fallback failed: ${endpoint}`, retryErr.message);
                }
            }

            // Return graceful error payload instead of throwing
            return {
                answer: `Service temporarily unavailable. Error: ${error.message}`,
                creditsUsed: 0,
                status: 'error',
                error: true
            };
        }
    }

    normalizeResponse(d) {
        if (!d) return { answer: 'Empty response', creditsUsed: 0 };

        if (typeof d === 'string') return { answer: d, creditsUsed: 0 };

        if (d.answer && typeof d.answer === 'string') {
            return {
                answer: d.answer,
                creditsUsed: d.creditsUsed || d.usage?.total_tokens || 0,
                finish_reason: d.finish_reason || 'stop'
            };
        }

        if (Array.isArray(d.choices) && d.choices.length > 0) {
            const first = d.choices[0];
            const text = first.text || first.message?.content || '';
            return {
                answer: text,
                creditsUsed: d.usage?.total_tokens || 0,
                finish_reason: first.finish_reason || 'stop'
            };
        }

        return {
            answer: JSON.stringify(d),
            creditsUsed: 0,
            finish_reason: 'unknown'
        };
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
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        logger.info('LLM cache cleared');
    }
}

module.exports = new LLMService();
