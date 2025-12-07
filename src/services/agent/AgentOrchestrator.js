const chainGPTLLM = require('../chainGPT/LLMService');
const chainGPTAuditor = require('../chainGPT/AuditorService');
const chainGPTGenerator = require('../chainGPT/GeneratorService');
const contractDeployService = require('../blockchain/ContractDeployService');
const swapService = require('../blockchain/SwapService');
const multiNetworkService = require('../blockchain/MultiNetworkService');
const membaseService = require('../memory/MembaseService');
const logger = require('../../utils/logger');

/**
 * Agent Orchestrator
 * Unified controller for multi-step AI agent workflows
 * 
 * Implements Quack × ChainGPT Super Web3 Agent functionality:
 * - Research & Explain
 * - Generate & Audit Smart Contracts
 * - Execute on-chain actions
 * - Multi-step workflows with memory
 */
class AgentOrchestrator {
    constructor() {
        this.workflows = new Map();
        this.workflowCounter = 0;
    }

    /**
     * Execute research and explain workflow
     * @param {string} query - Research query
     * @param {string} userId - User identifier
     * @returns {Promise<Object>} Research results
     */
    async researchAndExplain(query, userId) {
        try {
            const workflowId = this.createWorkflowId('research');

            this.updateWorkflowStatus(workflowId, 'running', {
                step: 'research',
                query
            });

            // Use ChainGPT for Web3 research
            const response = await chainGPTLLM.chat(
                query,
                'general_assistant',
                'You are a Web3 expert. Provide clear, accurate explanations about blockchain, DeFi, and Web3 concepts.'
            );

            // Store in memory
            await membaseService.storeConversation(
                userId,
                query,
                response.response
            );

            this.updateWorkflowStatus(workflowId, 'completed', {
                step: 'research',
                response: response.response
            });

            logger.info('Research workflow completed', { workflowId, userId });

            return {
                success: true,
                workflowId,
                query,
                response: response.response,
                tokensUsed: response.tokens_used
            };
        } catch (error) {
            logger.error('Research workflow error:', error.message);
            throw new Error(`Research failed: ${error.message}`);
        }
    }

    /**
     * Execute generate, audit, and optionally deploy contract workflow
     * @param {string} description - Contract description
     * @param {Object} options - Workflow options
     * @returns {Promise<Object>} Workflow results
     */
    async generateAndAuditContract(description, options = {}) {
        try {
            const {
                autoDeploy = false,
                network = 'bnb-testnet',
                userId = 'default'
            } = options;

            const workflowId = this.createWorkflowId('generate-audit');

            // Step 1: Generate contract
            this.updateWorkflowStatus(workflowId, 'running', {
                step: 'generating',
                description
            });

            const generated = await chainGPTGenerator.generateContract(description);

            // Step 2: Audit contract
            this.updateWorkflowStatus(workflowId, 'running', {
                step: 'auditing',
                contractGenerated: true
            });

            const audit = await chainGPTAuditor.auditContract(generated.contract_code);

            // Step 3: Deploy if requested and safe
            let deployment = null;
            if (autoDeploy && audit.risk_level !== 'critical') {
                this.updateWorkflowStatus(workflowId, 'running', {
                    step: 'deploying',
                    auditPassed: true
                });

                // Switch to specified network
                multiNetworkService.switchNetwork(network);

                // Note: Actual deployment would require compiled bytecode and ABI
                // This is a simplified version for demo
                deployment = {
                    status: 'simulated',
                    message: 'Contract deployment simulated (requires compiled bytecode)',
                    network
                };
            }

            // Store workflow in memory
            await membaseService.store('workflows', {
                workflowId,
                type: 'generate-audit-deploy',
                description,
                generated: true,
                audited: true,
                deployed: autoDeploy,
                userId,
                timestamp: new Date().toISOString()
            });

            this.updateWorkflowStatus(workflowId, 'completed', {
                generated: true,
                audited: true,
                deployed: !!deployment
            });

            logger.info('Generate-audit workflow completed', { workflowId, userId });

            return {
                success: true,
                workflowId,
                steps: {
                    generation: {
                        completed: true,
                        contractCode: generated.contract_code,
                        explanation: generated.explanation
                    },
                    audit: {
                        completed: true,
                        riskLevel: audit.risk_level,
                        issues: audit.issues,
                        recommendations: audit.recommendations
                    },
                    deployment: deployment ? {
                        completed: true,
                        ...deployment
                    } : {
                        completed: false,
                        reason: autoDeploy ? 'Audit failed' : 'Not requested'
                    }
                }
            };
        } catch (error) {
            logger.error('Generate-audit workflow error:', error.message);
            throw new Error(`Workflow failed: ${error.message}`);
        }
    }

    /**
     * Execute DeFi action workflow (swap, stake, etc.)
     * @param {Object} actionParams - Action parameters
     * @returns {Promise<Object>} Action results
     */
    async executeDeFiAction(actionParams) {
        try {
            const {
                action,
                fromToken,
                toToken,
                amount,
                slippage = 0.5,
                network = 'bnb-testnet',
                userId = 'default'
            } = actionParams;

            const workflowId = this.createWorkflowId('defi-action');

            // Switch to specified network
            multiNetworkService.switchNetwork(network);

            this.updateWorkflowStatus(workflowId, 'running', {
                step: 'executing',
                action,
                network
            });

            let result;

            switch (action) {
                case 'swap':
                    // Execute token swap
                    result = await swapService.executeSwap(fromToken, toToken, amount, slippage);
                    break;

                case 'stake':
                    // Staking would be implemented here
                    result = {
                        status: 'simulated',
                        message: 'Staking simulation (requires staking contract integration)'
                    };
                    break;

                default:
                    throw new Error(`Unsupported action: ${action}`);
            }

            // Store in memory
            await membaseService.storeTransaction({
                workflowId,
                action,
                network,
                result,
                userId,
                timestamp: new Date().toISOString()
            });

            this.updateWorkflowStatus(workflowId, 'completed', {
                action,
                result
            });

            logger.info('DeFi action workflow completed', { workflowId, action, userId });

            return {
                success: true,
                workflowId,
                action,
                network,
                result
            };
        } catch (error) {
            logger.error('DeFi action workflow error:', error.message);
            throw new Error(`DeFi action failed: ${error.message}`);
        }
    }

    /**
     * Execute multi-step workflow
     * @param {string} workflowType - Type of workflow
     * @param {Object} params - Workflow parameters
     * @returns {Promise<Object>} Workflow results
     */
    async executeWorkflow(workflowType, params) {
        switch (workflowType) {
            case 'research':
                return await this.researchAndExplain(params.query, params.userId);

            case 'generate-contract':
                return await this.generateAndAuditContract(params.description, params.options);

            case 'defi-action':
                return await this.executeDeFiAction(params);

            default:
                throw new Error(`Unknown workflow type: ${workflowType}`);
        }
    }

    /**
     * Get workflow status
     * @param {string} workflowId - Workflow identifier
     * @returns {Object} Workflow status
     */
    getWorkflowStatus(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        return workflow;
    }

    /**
     * Create workflow ID
     * @param {string} type - Workflow type
     * @returns {string} Workflow ID
     */
    createWorkflowId(type) {
        return `workflow_${type}_${++this.workflowCounter}_${Date.now()}`;
    }

    /**
     * Update workflow status
     * @param {string} workflowId - Workflow identifier
     * @param {string} status - Workflow status
     * @param {Object} data - Additional data
     */
    updateWorkflowStatus(workflowId, status, data = {}) {
        this.workflows.set(workflowId, {
            workflowId,
            status,
            ...data,
            updatedAt: new Date().toISOString()
        });
    }

    /**
     * Get workflow statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        const workflows = Array.from(this.workflows.values());
        return {
            totalWorkflows: workflows.length,
            runningWorkflows: workflows.filter(w => w.status === 'running').length,
            completedWorkflows: workflows.filter(w => w.status === 'completed').length,
            failedWorkflows: workflows.filter(w => w.status === 'failed').length
        };
    }
}

module.exports = new AgentOrchestrator();
