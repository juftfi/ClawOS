const multiNetworkService = require('../blockchain/MultiNetworkService');
const logger = require('../../utils/logger');
const { parseEther, formatEther } = require('viem');

/**
 * AWE Network Agent Service
 * Implements ERC-8004 compliant AI agents on Base Sepolia
 * 
 * ERC-8004 Standard: On-chain AI Agent Identity
 * - Identity NFT for agent
 * - Agent-controlled wallet
 * - On-chain reputation
 */
class AWEAgentService {
    constructor() {
        this.network = 'base-sepolia';
        this.agents = new Map(); // In-memory storage for demo

        // ERC-8004 Agent Registry (simplified for testnet demo)
        this.agentRegistry = {
            nextAgentId: 1,
            agents: []
        };
    }

    /**
     * Create ERC-8004 compliant agent
     * @param {Object} agentConfig - Agent configuration
     * @returns {Promise<Object>} Created agent info
     */
    async createAgent(agentConfig) {
        try {
            const { name, description, capabilities = [] } = agentConfig;

            // Switch to Base Sepolia
            multiNetworkService.switchNetwork(this.network);
            const clients = multiNetworkService.getViemClients(this.network);
            const config = multiNetworkService.getNetworkConfig(this.network);

            // Generate unique agent ID
            const agentId = `agent_${this.agentRegistry.nextAgentId++}_${Date.now()}`;

            // Create agent identity (simplified - in production would mint ERC-8004 NFT)
            const agent = {
                agentId,
                name,
                description,
                capabilities,
                network: this.network,
                chainId: config.chainId,

                // Agent wallet (same as deployer for testnet demo)
                walletAddress: config.walletAddress,

                // Identity NFT (would be minted on-chain in production)
                identityNFT: {
                    tokenId: this.agentRegistry.nextAgentId - 1,
                    contractAddress: '0x0000000000000000000000000000000000000000', // Placeholder
                    metadata: {
                        name,
                        description,
                        image: `https://api.dicebear.com/7.x/bottts/svg?seed=${agentId}`,
                        attributes: capabilities.map(cap => ({ trait_type: 'capability', value: cap }))
                    }
                },

                // Agent status
                status: 'active',
                createdAt: new Date().toISOString(),

                // Reputation (on-chain in production)
                reputation: {
                    score: 0,
                    interactions: 0,
                    successRate: 0
                }
            };

            // Store agent
            this.agents.set(agentId, agent);
            this.agentRegistry.agents.push(agent);

            logger.info('ERC-8004 agent created', {
                agentId,
                name,
                network: this.network
            });

            return {
                success: true,
                agent: {
                    agentId: agent.agentId,
                    name: agent.name,
                    walletAddress: agent.walletAddress,
                    identityNFT: agent.identityNFT,
                    network: agent.network,
                    chainId: agent.chainId,
                    status: agent.status,
                    createdAt: agent.createdAt
                }
            };
        } catch (error) {
            logger.error('Create agent error:', error.message);
            throw new Error(`Failed to create agent: ${error.message}`);
        }
    }

    /**
     * Get agent information
     * @param {string} agentId - Agent identifier
     * @returns {Object} Agent info
     */
    getAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        return agent;
    }

    /**
     * List all agents
     * @returns {Array} List of agents
     */
    listAgents() {
        return Array.from(this.agents.values());
    }

    /**
     * Get agent wallet balance
     * @param {string} agentId - Agent identifier
     * @returns {Promise<Object>} Balance info
     */
    async getAgentBalance(agentId) {
        const agent = this.getAgent(agentId);
        return await multiNetworkService.getBalance(agent.walletAddress, this.network);
    }

    /**
     * Fund agent wallet (testnet only)
     * @param {string} agentId - Agent identifier
     * @param {string} amount - Amount in ETH
     * @returns {Promise<Object>} Transaction result
     */
    async fundAgentWallet(agentId, amount) {
        try {
            const agent = this.getAgent(agentId);
            const clients = multiNetworkService.getViemClients(this.network);
            const config = multiNetworkService.getNetworkConfig(this.network);

            // Send ETH to agent wallet (for testnet demo)
            const hash = await clients.wallet.sendTransaction({
                to: agent.walletAddress,
                value: parseEther(amount)
            });

            logger.info('Agent wallet funded', {
                agentId,
                amount,
                txHash: hash
            });

            return {
                success: true,
                agentId,
                amount,
                txHash: hash,
                network: this.network
            };
        } catch (error) {
            logger.error('Fund agent wallet error:', error.message);
            throw new Error(`Failed to fund agent wallet: ${error.message}`);
        }
    }

    /**
     * Update agent reputation (on-chain in production)
     * @param {string} agentId - Agent identifier
     * @param {boolean} success - Whether interaction was successful
     */
    updateReputation(agentId, success) {
        const agent = this.getAgent(agentId);

        agent.reputation.interactions++;
        if (success) {
            agent.reputation.score++;
        }
        agent.reputation.successRate = agent.reputation.score / agent.reputation.interactions;

        logger.info('Agent reputation updated', {
            agentId,
            reputation: agent.reputation
        });
    }

    /**
     * Get agent statistics
     * @returns {Object} Registry statistics
     */
    getStatistics() {
        return {
            totalAgents: this.agents.size,
            activeAgents: Array.from(this.agents.values()).filter(a => a.status === 'active').length,
            network: this.network,
            chainId: multiNetworkService.getNetworkConfig(this.network).chainId
        };
    }
}

module.exports = new AWEAgentService();
