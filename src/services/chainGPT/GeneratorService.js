const llmService = require('./LLMService');
const logger = require('../../utils/logger');

class GeneratorService {
    constructor() {
        this.systemMessage = 'You are an expert Solidity smart contract developer. Generate production-ready, secure, and gas-optimized smart contracts. Always include complete code with all necessary imports, events, and error handling.';
    }

    /**
     * Generate ERC20 token contract
     * @param {Object} params - Token parameters
     * @returns {Promise<Object>} Contract code, ABI, and constructor params
     */
    async generateERC20(params) {
        try {
            const {
                name = 'MyToken',
                symbol = 'MTK',
                decimals = 18,
                totalSupply = '1000000',
                mintable = false,
                burnable = false,
                pausable = false,
                capped = false,
                maxSupply = null
            } = params;

            const features = [];
            if (mintable) features.push('mintable');
            if (burnable) features.push('burnable');
            if (pausable) features.push('pausable');
            if (capped && maxSupply) features.push(`capped at ${maxSupply}`);

            const prompt = `Generate a complete ERC20 token smart contract with these specifications:

Token Name: ${name}
Symbol: ${symbol}
Decimals: ${decimals}
Initial Supply: ${totalSupply}
Features: ${features.length > 0 ? features.join(', ') : 'standard ERC20'}

Requirements:
- Use OpenZeppelin contracts (import from @openzeppelin/contracts)
- Include proper access control (Ownable)
- Add comprehensive events
- Follow ERC20 standard exactly
- Include detailed comments
- Use Solidity ^0.8.0

Provide ONLY the complete Solidity code, no explanations.`;

            const response = await llmService.chat(prompt, 'gpt-4', this.systemMessage);

            const contractCode = this.extractCode(response.response);
            const abi = this.generateERC20ABI(params);
            const constructorParams = this.getERC20ConstructorParams(params);

            return {
                contract_code: contractCode,
                abi,
                constructor_params: constructorParams,
                token_info: {
                    name,
                    symbol,
                    decimals,
                    totalSupply,
                    features
                },
                tokens_used: response.tokens_used,
                model_used: response.model_used
            };
        } catch (error) {
            logger.error('ERC20 generation error:', error.message);
            throw new Error(`Failed to generate ERC20 contract: ${error.message}`);
        }
    }

    /**
     * Generate ERC721 NFT contract
     * @param {Object} params - NFT parameters
     * @returns {Promise<Object>} Contract code, ABI, and constructor params
     */
    async generateERC721(params) {
        try {
            const {
                name = 'MyNFT',
                symbol = 'MNFT',
                baseURI = '',
                maxSupply = null,
                mintPrice = '0',
                royalties = false,
                royaltyPercentage = 0
            } = params;

            const features = [];
            if (maxSupply) features.push(`max supply of ${maxSupply}`);
            if (mintPrice !== '0') features.push(`mint price of ${mintPrice} ETH`);
            if (royalties) features.push(`${royaltyPercentage}% royalties`);

            const prompt = `Generate a complete ERC721 NFT smart contract with these specifications:

Collection Name: ${name}
Symbol: ${symbol}
Base URI: ${baseURI || 'ipfs://'}
${maxSupply ? `Max Supply: ${maxSupply}` : 'Unlimited supply'}
${mintPrice !== '0' ? `Mint Price: ${mintPrice} ETH` : 'Free minting'}
${royalties ? `Royalties: ${royaltyPercentage}% (EIP-2981)` : 'No royalties'}

Requirements:
- Use OpenZeppelin ERC721 implementation
- Include minting functionality
- Add proper access control
- Include URI management
- Add comprehensive events
- Use Solidity ^0.8.0
${royalties ? '- Implement EIP-2981 royalty standard' : ''}

Provide ONLY the complete Solidity code, no explanations.`;

            const response = await llmService.chat(prompt, 'gpt-4', this.systemMessage);

            const contractCode = this.extractCode(response.response);
            const abi = this.generateERC721ABI(params);
            const constructorParams = this.getERC721ConstructorParams(params);

            return {
                contract_code: contractCode,
                abi,
                constructor_params: constructorParams,
                nft_info: {
                    name,
                    symbol,
                    baseURI,
                    maxSupply,
                    mintPrice,
                    features
                },
                tokens_used: response.tokens_used,
                model_used: response.model_used
            };
        } catch (error) {
            logger.error('ERC721 generation error:', error.message);
            throw new Error(`Failed to generate ERC721 contract: ${error.message}`);
        }
    }

    /**
     * Generate token swap contract
     * @param {string} fromToken - Token to swap from
     * @param {string} toToken - Token to swap to
     * @returns {Promise<Object>} Contract code and details
     */
    async generateSwapContract(fromToken, toToken) {
        try {
            const prompt = `Generate a secure token swap smart contract with these specifications:

From Token: ${fromToken}
To Token: ${toToken}

Requirements:
- Accept ${fromToken} and swap to ${toToken}
- Use Uniswap V2/V3 Router for price discovery
- Include slippage protection
- Add deadline for swaps
- Implement proper access control
- Add events for all swaps
- Include emergency withdraw function
- Use Solidity ^0.8.0

Provide ONLY the complete Solidity code, no explanations.`;

            const response = await llmService.chat(prompt, 'gpt-4', this.systemMessage);

            const contractCode = this.extractCode(response.response);

            return {
                contract_code: contractCode,
                abi: this.generateSwapABI(),
                constructor_params: {
                    routerAddress: 'address',
                    fromTokenAddress: 'address',
                    toTokenAddress: 'address'
                },
                swap_info: {
                    fromToken,
                    toToken,
                    type: 'token_swap'
                },
                tokens_used: response.tokens_used,
                model_used: response.model_used
            };
        } catch (error) {
            logger.error('Swap contract generation error:', error.message);
            throw new Error(`Failed to generate swap contract: ${error.message}`);
        }
    }

    /**
     * Generate simple transfer contract
     * @returns {Promise<Object>} Contract code and details
     */
    async generateTransferContract() {
        try {
            const prompt = `Generate a simple, secure ETH/token transfer smart contract with these features:

- Accept ETH deposits
- Allow owner to withdraw ETH
- Support ERC20 token transfers
- Include batch transfer functionality
- Add proper access control
- Include events for all transfers
- Add emergency pause functionality
- Use Solidity ^0.8.0

Provide ONLY the complete Solidity code, no explanations.`;

            const response = await llmService.chat(prompt, 'gpt-4', this.systemMessage);

            const contractCode = this.extractCode(response.response);

            return {
                contract_code: contractCode,
                abi: this.generateTransferABI(),
                constructor_params: {},
                contract_info: {
                    type: 'transfer_contract',
                    features: ['ETH transfer', 'ERC20 transfer', 'batch transfer', 'pausable']
                },
                tokens_used: response.tokens_used,
                model_used: response.model_used
            };
        } catch (error) {
            logger.error('Transfer contract generation error:', error.message);
            throw new Error(`Failed to generate transfer contract: ${error.message}`);
        }
    }

    /**
     * Extract code from LLM response
     * @param {string} response - LLM response
     * @returns {string} Extracted code
     */
    extractCode(response) {
        // Remove markdown code blocks
        let code = response.replace(/```solidity\n?/g, '').replace(/```\n?/g, '');

        // Trim whitespace
        code = code.trim();

        return code;
    }

    /**
     * Generate ERC20 ABI template
     * @param {Object} params - Token parameters
     * @returns {Array} ABI array
     */
    generateERC20ABI(params) {
        const baseABI = [
            { type: 'constructor', inputs: [] },
            { type: 'function', name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view' },
            { type: 'function', name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view' },
            { type: 'function', name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view' },
            { type: 'function', name: 'totalSupply', outputs: [{ type: 'uint256' }], stateMutability: 'view' },
            { type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
            { type: 'function', name: 'transfer', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
            { type: 'function', name: 'approve', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
            { type: 'function', name: 'transferFrom', inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }
        ];

        if (params.mintable) {
            baseABI.push({ type: 'function', name: 'mint', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }] });
        }

        if (params.burnable) {
            baseABI.push({ type: 'function', name: 'burn', inputs: [{ name: 'amount', type: 'uint256' }] });
        }

        return baseABI;
    }

    /**
     * Generate ERC721 ABI template
     * @param {Object} params - NFT parameters
     * @returns {Array} ABI array
     */
    generateERC721ABI(params) {
        return [
            { type: 'constructor', inputs: [] },
            { type: 'function', name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view' },
            { type: 'function', name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view' },
            { type: 'function', name: 'tokenURI', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'string' }], stateMutability: 'view' },
            { type: 'function', name: 'mint', inputs: [{ name: 'to', type: 'address' }], outputs: [{ type: 'uint256' }] },
            { type: 'function', name: 'ownerOf', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'address' }], stateMutability: 'view' },
            { type: 'function', name: 'transferFrom', inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'tokenId', type: 'uint256' }] }
        ];
    }

    /**
     * Generate swap contract ABI
     * @returns {Array} ABI array
     */
    generateSwapABI() {
        return [
            { type: 'function', name: 'swap', inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'amountOutMin', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
            { type: 'function', name: 'getAmountOut', inputs: [{ name: 'amountIn', type: 'uint256' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' }
        ];
    }

    /**
     * Generate transfer contract ABI
     * @returns {Array} ABI array
     */
    generateTransferABI() {
        return [
            { type: 'function', name: 'transferETH', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }] },
            { type: 'function', name: 'transferToken', inputs: [{ name: 'token', type: 'address' }, { name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }] },
            { type: 'function', name: 'batchTransfer', inputs: [{ name: 'recipients', type: 'address[]' }, { name: 'amounts', type: 'uint256[]' }] }
        ];
    }

    /**
     * Get ERC20 constructor parameters
     * @param {Object} params - Token parameters
     * @returns {Object} Constructor parameters
     */
    getERC20ConstructorParams(params) {
        return {
            name: params.name || 'MyToken',
            symbol: params.symbol || 'MTK',
            initialSupply: params.totalSupply || '1000000'
        };
    }

    /**
     * Get ERC721 constructor parameters
     * @param {Object} params - NFT parameters
     * @returns {Object} Constructor parameters
     */
    getERC721ConstructorParams(params) {
        return {
            name: params.name || 'MyNFT',
            symbol: params.symbol || 'MNFT',
            baseURI: params.baseURI || ''
        };
    }
}

module.exports = new GeneratorService();
