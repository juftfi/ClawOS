const chainGPTLLM = require('../chainGPT/LLMService');
const logger = require('../../utils/logger');

/**
 * X-Bot Service
 * Helps agents draft and "socialize" their successes
 * Inspired by User's request for active X presence
 */
class XBotService {
    /**
     * Draft a viral X post for a completed workflow
     * @param {Object} workflow - The completed workflow data
     * @returns {Promise<string>} Drafted post content
     */
    async draftPost(workflow) {
        logger.info('Drafting X post for workflow', { type: workflow.type });

        const systemPrompt = `
        You are a Web3 Social Media Strategist. Your goal is to draft a "Vibe-heavy" X (Twitter) post about a successful AI agent action.
        The project is "AgentOS" - an AI-native OS on BNB Chain.
        
        Key elements to include:
        - The specific result (e.g., negotiated a discount, deployed a safe contract).
        - Hashtags: #VibingOnBNB #AgentOS #Web3AI
        - Tone: Sleek, futuristic, and results-oriented.
        - Mentions: @BNBChain, @Unibase_AI (if memory used), @ChainGPT (if AI used).
        
        Workflow Data: ${JSON.stringify(workflow)}
        
        Output only the text of the post.
        `;

        const response = await chainGPTLLM.chat(
            `Draft a viral post for: ${workflow.summary}`,
            'general_assistant',
            systemPrompt
        );

        return response.response.trim();
    }
}

module.exports = new XBotService();
