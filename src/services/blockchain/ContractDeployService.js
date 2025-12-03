const blockchainService = require('./BlockchainService');
const logger = require('../../utils/logger');

class ContractDeployService {
    constructor() {
        this.web3 = blockchainService.getWeb3();
    }

    /**
     * Deploy smart contract
     * @param {string} contractCode - Contract bytecode
     * @param {Array} abi - Contract ABI
     * @param {Array} constructorArgs - Constructor arguments
     * @param {number} gasLimit - Gas limit (optional)
     * @returns {Promise<Object>} Deployment result
     */
    async deployContract(contractCode, abi, constructorArgs = [], gasLimit = null) {
        try {
            const account = blockchainService.getAccount();

            // Ensure bytecode starts with 0x
            const bytecode = contractCode.startsWith('0x') ? contractCode : `0x${contractCode}`;

            // Create contract instance
            const contract = new this.web3.eth.Contract(abi);

            // Prepare deployment transaction
            const deployTx = contract.deploy({
                data: bytecode,
                arguments: constructorArgs
            });

            // Estimate gas if not provided
            let gas = gasLimit;
            if (!gas) {
                try {
                    gas = await deployTx.estimateGas({ from: account.address });
                    gas = Math.floor(Number(gas) * 1.2); // Add 20% buffer
                } catch (error) {
                    logger.warn('Gas estimation failed, using default:', error.message);
                    gas = 3000000; // Default gas limit
                }
            }

            const gasPrice = await blockchainService.getGasPrice();
            const nonce = await this.web3.eth.getTransactionCount(account.address, 'pending');

            const transaction = {
                from: account.address,
                data: deployTx.encodeABI(),
                gas: gas.toString(),
                gasPrice: gasPrice.wei,
                nonce,
                chainId: blockchainService.chainId
            };

            logger.info('Deploying contract', {
                gas,
                gasPrice: gasPrice.gwei,
                constructorArgs
            });

            // Sign and send transaction
            const signedTx = await this.web3.eth.accounts.signTransaction(
                transaction,
                account.privateKey
            );

            const receipt = await this.web3.eth.sendSignedTransaction(
                signedTx.rawTransaction
            );

            if (!receipt.contractAddress) {
                throw new Error('Contract deployment failed - no contract address in receipt');
            }

            const gasUsed = receipt.gasUsed;
            const gasCostWei = BigInt(gasUsed) * BigInt(transaction.gasPrice);
            const gasCostBNB = this.web3.utils.fromWei(gasCostWei.toString(), 'ether');

            logger.info('Contract deployed successfully', {
                address: receipt.contractAddress,
                txHash: receipt.transactionHash
            });

            return {
                contract_address: receipt.contractAddress,
                tx_hash: receipt.transactionHash,
                deployed_at_block: receipt.blockNumber.toString(),
                deployer: receipt.from,
                gas_used: gasUsed.toString(),
                deployment_cost_bnb: gasCostBNB,
                status: receipt.status ? 'success' : 'failed',
                constructor_args: constructorArgs,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Contract deployment error:', error.message);
            throw new Error(`Failed to deploy contract: ${error.message}`);
        }
    }

    /**
     * Verify contract deployment
     * @param {string} contractAddress - Contract address to verify
     * @returns {Promise<Object>} Verification result
     */
    async verifyDeployment(contractAddress) {
        try {
            if (!blockchainService.validateAddress(contractAddress)) {
                throw new Error('Invalid contract address format');
            }

            // Get contract code
            const code = await this.web3.eth.getCode(contractAddress);

            // Check if contract exists (code should be more than '0x')
            const isDeployed = code && code !== '0x' && code.length > 2;

            if (!isDeployed) {
                return {
                    is_deployed: false,
                    contract_address: contractAddress,
                    message: 'No contract found at this address'
                };
            }

            // Get additional info
            const [balance, blockNumber] = await Promise.all([
                this.web3.eth.getBalance(contractAddress),
                this.web3.eth.getBlockNumber()
            ]);

            logger.info('Contract verified', { contractAddress, isDeployed });

            return {
                is_deployed: true,
                contract_address: contractAddress,
                code_size: code.length,
                balance_wei: balance.toString(),
                balance_bnb: this.web3.utils.fromWei(balance, 'ether'),
                current_block: blockNumber.toString(),
                verified_at: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Contract verification error:', error.message);
            throw new Error(`Failed to verify deployment: ${error.message}`);
        }
    }

    /**
     * Deploy contract from Solidity source
     * @param {string} solidityCode - Solidity source code
     * @param {string} contractName - Contract name to deploy
     * @param {Array} constructorArgs - Constructor arguments
     * @returns {Promise<Object>} Deployment result
     */
    async deployFromSolidity(solidityCode, contractName, constructorArgs = []) {
        try {
            // Note: This requires solc compiler
            // For production, you'd want to compile the contract first
            throw new Error('Solidity compilation not implemented. Please provide compiled bytecode and ABI.');
        } catch (error) {
            logger.error('Deploy from Solidity error:', error.message);
            throw error;
        }
    }

    /**
     * Estimate deployment cost
     * @param {string} contractCode - Contract bytecode
     * @param {Array} abi - Contract ABI
     * @param {Array} constructorArgs - Constructor arguments
     * @returns {Promise<Object>} Cost estimate
     */
    async estimateDeploymentCost(contractCode, abi, constructorArgs = []) {
        try {
            const account = blockchainService.getAccount();
            const bytecode = contractCode.startsWith('0x') ? contractCode : `0x${contractCode}`;

            const contract = new this.web3.eth.Contract(abi);
            const deployTx = contract.deploy({
                data: bytecode,
                arguments: constructorArgs
            });

            const gas = await deployTx.estimateGas({ from: account.address });
            const gasPrice = await blockchainService.getGasPrice();

            const gasCostWei = BigInt(gas) * BigInt(gasPrice.wei);
            const gasCostBNB = this.web3.utils.fromWei(gasCostWei.toString(), 'ether');

            return {
                estimated_gas: gas.toString(),
                gas_price_gwei: gasPrice.gwei,
                estimated_cost_wei: gasCostWei.toString(),
                estimated_cost_bnb: gasCostBNB,
                estimated_cost_formatted: `${parseFloat(gasCostBNB).toFixed(6)} BNB`,
                constructor_args: constructorArgs
            };
        } catch (error) {
            logger.error('Estimate deployment cost error:', error.message);
            throw new Error(`Failed to estimate deployment cost: ${error.message}`);
        }
    }

    /**
     * Get contract creation transaction
     * @param {string} contractAddress - Contract address
     * @returns {Promise<Object>} Creation transaction details
     */
    async getContractCreationTx(contractAddress) {
        try {
            if (!blockchainService.validateAddress(contractAddress)) {
                throw new Error('Invalid contract address format');
            }

            // Note: Finding the creation tx requires scanning blocks or using an indexer
            // This is a simplified version
            logger.warn('Contract creation tx lookup requires block scanning or indexer');

            return {
                contract_address: contractAddress,
                message: 'Creation transaction lookup requires external indexer service'
            };
        } catch (error) {
            logger.error('Get contract creation tx error:', error.message);
            throw new Error(`Failed to get contract creation tx: ${error.message}`);
        }
    }

    /**
     * Deploy multiple contracts in batch
     * @param {Array} contracts - Array of {bytecode, abi, constructorArgs}
     * @returns {Promise<Object>} Batch deployment results
     */
    async batchDeploy(contracts) {
        try {
            const results = [];
            const errors = [];

            for (let i = 0; i < contracts.length; i++) {
                const { bytecode, abi, constructorArgs = [] } = contracts[i];

                try {
                    const result = await this.deployContract(bytecode, abi, constructorArgs);
                    results.push({
                        index: i,
                        ...result
                    });
                } catch (error) {
                    errors.push({
                        index: i,
                        error: error.message
                    });
                }
            }

            return {
                successful: results.length,
                failed: errors.length,
                total: contracts.length,
                results,
                errors
            };
        } catch (error) {
            logger.error('Batch deploy error:', error.message);
            throw new Error(`Failed to batch deploy contracts: ${error.message}`);
        }
    }
}

module.exports = new ContractDeployService();
