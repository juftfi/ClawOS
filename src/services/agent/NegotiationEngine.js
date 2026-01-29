const chainGPTLLM = require('../chainGPT/LLMService');
const logger = require('../../utils/logger');

/**
 * Negotiation Engine
 * Enables autonomous agreement between agents
 * Inspired by AgentBridge Brief
 */
class NegotiationEngine {
    /**
     * Negotiate price or terms for a service
     * @param {string} query - User requirement
     * @param {Object} service - Service provider details
     * @returns {Promise<Object>} Negotiation result
     */
    async negotiate(query, service) {
        logger.info('Starting autonomous negotiation', { serviceId: service.id });

        const systemPrompt = `
        You are an Autonomous Procurement Agent. Your goal is to negotiate the best terms for your user.
        The user wants: "${query}"
        The service is: "${service.name}" (${service.description})
        Standard Price: ${JSON.stringify(service.pricing)}

        Instructions:
        1. Evaluate if the service fits the user's query.
        2. Propose a fair offer or ask for a discount if applicable (simulate a 5-10% professional discount query).
        3. Finalize the "Agreed Price" and explain the logic.
        4. Output format: JSON { agreedPrice, currency, explanation, discountApplied }
        `;

        const response = await chainGPTLLM.chat(
            `Negotiate for "${service.name}" regarding: ${query}`,
            'general_assistant',
            systemPrompt
        );

        try {
            // Attempt to parse JSON from AI response
            // AI responses can be wordy, so we might need to extract the JSON block
            const jsonMatch = response.response.match(/\{[\s\S]*\}/);
            const negotiationData = jsonMatch ? JSON.parse(jsonMatch[0]) : {
                agreedPrice: service.pricing.amount,
                currency: service.pricing.currency,
                explanation: response.response,
                discountApplied: false
            };

            logger.info('Negotiation completed', { agreedPrice: negotiationData.agreedPrice });

            return {
                success: true,
                serviceId: service.id,
                ...negotiationData
            };
        } catch (error) {
            logger.warn('Failed to parse negotiation JSON, returning fallback', { error: error.message });
            return {
                success: true,
                serviceId: service.id,
                agreedPrice: service.pricing.amount,
                currency: service.pricing.currency,
                explanation: response.response,
                discountApplied: false
            };
        }
    }
}

module.exports = new NegotiationEngine();
