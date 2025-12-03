const blockchainService = require('./BlockchainService');
const logger = require('../../utils/logger');

class ContractCallService {
    constructor() {
        this.web3 = blockchainService.getWeb3();
    }

    /**
     * Call contract method (read-only, no transaction)
     * @param {string} contractAddress - Contract address
     * @param {string} methodName - Method name to call
     * @param {Array} params - Method parameters
     * @param {Array} abi - Contract ABI
     * @returns {Promise<any>} Method return value
     */
    async callContractMethod(contractAddress, methodName, params = [], abi) {
        try {
            if (!blockchainService.validateAddress(contractAddress)) {
                throw new Error('Invalid contract address format');
            }

            const contract = new this.web3.eth.Contract(abi, contractAddress);

            if (!contract.methods[methodName]) {
                throw new Error(`Method '${methodName}' not found in contract ABI`);
            }

            logger.info('Calling contract method', {
                contractAddress,
                methodName,
                params
            });

            const result = await contract.methods[methodName](...params).call();

            return {
                contract_address: contractAddress,
                method: methodName,
                params,
                result,
                call_type: 'read',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Call contract method error:', error.message);
            throw new Error(`Failed to call contract method: ${error.message}`);
        }
    }

    /**
     * Write to contract method (creates transaction)
     * @param {string} contractAddress - Contract address
     * @param {string} methodName - Method name to call
     * @param {Array} params - Method parameters
     * @param {Array} abi - Contract ABI
     * @param {string} value - ETH/BNB value to send (optional)
     * @returns {Promise<Object>} Transaction result
     */
    async writeContractMethod(contractAddress, methodName, params = [], abi, value = '0') {
        try {
            const account = blockchainService.getAccount();

            if (!blockchainService.validateAddress(contractAddress)) {
                throw new Error('Invalid contract address format');
            }

            const contract = new this.web3.eth.Contract(abi, contractAddress);

            if (!contract.methods[methodName]) {
                throw new Error(`Method '${methodName}' not found in contract ABI`);
            }

            logger.info('Writing to contract method', {
                contractAddress,
                methodName,
                params,
                value
            });

            const method = contract.methods[methodName](...params);

            // Estimate gas
            const gas = await method.estimateGas({
                from: account.address,
                value: value !== '0' ? this.web3.utils.toWei(value, 'ether') : '0'
            });

            const gasPrice = await blockchainService.getGasPrice();
            const nonce = await this.web3.eth.getTransactionCount(account.address, 'pending');

            const transaction = {
                from: account.address,
                to: contractAddress,
                data: method.encodeABI(),
                gas: Math.floor(Number(gas) * 1.2).toString(), // Add 20% buffer
                gasPrice: gasPrice.wei,
                value: value !== '0' ? this.web3.utils.toWei(value, 'ether') : '0',
                nonce,
                chainId: blockchainService.chainId
            };

            // Sign and send transaction
            const signedTx = await this.web3.eth.accounts.signTransaction(
                transaction,
                account.privateKey
            );

            const receipt = await this.web3.eth.sendSignedTransaction(
                signedTx.rawTransaction
            );

            const gasUsed = receipt.gasUsed;
            const gasCostWei = BigInt(gasUsed) * BigInt(transaction.gasPrice);
            const gasCostBNB = this.web3.utils.fromWei(gasCostWei.toString(), 'ether');

            logger.info('Contract method executed successfully', {
                txHash: receipt.transactionHash,
                gasUsed: gasUsed.toString()
            });

            return {
                tx_hash: receipt.transactionHash,
                status: receipt.status ? 'success' : 'failed',
                block_number: receipt.blockNumber.toString(),
                contract_address: contractAddress,
                method: methodName,
                params,
                value,
                gas_used: gasUsed.toString(),
                gas_cost_bnb: gasCostBNB,
                events: this.parseEvents(receipt, abi),
                call_type: 'write',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Write contract method error:', error.message);
            throw new Error(`Failed to write to contract: ${error.message}`);
        }
    }

    /**
     * Get contract state (read multiple values)
     * @param {string} contractAddress - Contract address
     * @param {Array} abi - Contract ABI
     * @param {Array} methods - Array of method names to call
     * @returns {Promise<Object>} Contract state
     */
    async getContractState(contractAddress, abi, methods = []) {
        try {
            if (!blockchainService.validateAddress(contractAddress)) {
                throw new Error('Invalid contract address format');
            }

            const contract = new this.web3.eth.Contract(abi, contractAddress);
            const state = {};

            // If no methods specified, try to get common view methods
            if (methods.length === 0) {
                methods = this.getViewMethods(abi);
            }

            for (const methodName of methods) {
                try {
                    if (contract.methods[methodName]) {
                        const result = await contract.methods[methodName]().call();
                        state[methodName] = result;
                    }
                } catch (error) {
                    logger.warn(`Failed to call ${methodName}:`, error.message);
                    state[methodName] = { error: error.message };
                }
            }

            return {
                contract_address: contractAddress,
                state,
                methods_called: methods.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Get contract state error:', error.message);
            throw new Error(`Failed to get contract state: ${error.message}`);
        }
    }

    /**
     * Batch call multiple contract methods
     * @param {string} contractAddress - Contract address
     * @param {Array} calls - Array of {methodName, params}
     * @param {Array} abi - Contract ABI
     * @returns {Promise<Object>} Batch call results
     */
    async batchCall(contractAddress, calls, abi) {
        try {
            const results = [];
            const errors = [];

            for (const call of calls) {
                try {
                    const result = await this.callContractMethod(
                        contractAddress,
                        call.methodName,
                        call.params || [],
                        abi
                    );
                    results.push(result);
                } catch (error) {
                    errors.push({
                        method: call.methodName,
                        params: call.params,
                        error: error.message
                    });
                }
            }

            return {
                successful: results.length,
                failed: errors.length,
                total: calls.length,
                results,
                errors
            };
        } catch (error) {
            logger.error('Batch call error:', error.message);
            throw new Error(`Failed to batch call: ${error.message}`);
        }
    }

    /**
     * Get contract events
     * @param {string} contractAddress - Contract address
     * @param {Array} abi - Contract ABI
     * @param {string} eventName - Event name (optional, gets all if not specified)
     * @param {number} fromBlock - Start block
     * @param {number} toBlock - End block
     * @returns {Promise<Array>} Events
     */
    async getContractEvents(contractAddress, abi, eventName = null, fromBlock = 0, toBlock = 'latest') {
        try {
            if (!blockchainService.validateAddress(contractAddress)) {
                throw new Error('Invalid contract address format');
            }

            const contract = new this.web3.eth.Contract(abi, contractAddress);

            let events;
            if (eventName) {
                events = await contract.getPastEvents(eventName, {
                    fromBlock,
                    toBlock
                });
            } else {
                events = await contract.getPastEvents('allEvents', {
                    fromBlock,
                    toBlock
                });
            }

            return {
                contract_address: contractAddress,
                event_name: eventName || 'all',
                from_block: fromBlock,
                to_block: toBlock,
                events_count: events.length,
                events: events.map(event => ({
                    event: event.event,
                    block_number: event.blockNumber,
                    transaction_hash: event.transactionHash,
                    return_values: event.returnValues,
                    log_index: event.logIndex
                }))
            };
        } catch (error) {
            logger.error('Get contract events error:', error.message);
            throw new Error(`Failed to get contract events: ${error.message}`);
        }
    }

    /**
     * Encode function call data
     * @param {string} methodName - Method name
     * @param {Array} params - Method parameters
     * @param {Array} abi - Contract ABI
     * @returns {string} Encoded data
     */
    encodeFunctionCall(methodName, params, abi) {
        try {
            const contract = new this.web3.eth.Contract(abi);

            if (!contract.methods[methodName]) {
                throw new Error(`Method '${methodName}' not found in ABI`);
            }

            const encodedData = contract.methods[methodName](...params).encodeABI();

            return {
                method: methodName,
                params,
                encoded_data: encodedData
            };
        } catch (error) {
            logger.error('Encode function call error:', error.message);
            throw new Error(`Failed to encode function call: ${error.message}`);
        }
    }

    /**
     * Decode function call data
     * @param {string} data - Encoded data
     * @param {Array} abi - Contract ABI
     * @returns {Object} Decoded data
     */
    decodeFunctionCall(data, abi) {
        try {
            const methodId = data.slice(0, 10);

            // Find matching method in ABI
            for (const item of abi) {
                if (item.type === 'function') {
                    const signature = `${item.name}(${item.inputs.map(i => i.type).join(',')})`;
                    const hash = this.web3.utils.keccak256(signature).slice(0, 10);

                    if (hash === methodId) {
                        const params = this.web3.eth.abi.decodeParameters(
                            item.inputs,
                            data.slice(10)
                        );

                        return {
                            method: item.name,
                            params: params,
                            signature
                        };
                    }
                }
            }

            throw new Error('Method not found in ABI');
        } catch (error) {
            logger.error('Decode function call error:', error.message);
            throw new Error(`Failed to decode function call: ${error.message}`);
        }
    }

    /**
     * Parse events from transaction receipt
     * @param {Object} receipt - Transaction receipt
     * @param {Array} abi - Contract ABI
     * @returns {Array} Parsed events
     */
    parseEvents(receipt, abi) {
        try {
            const events = [];

            if (receipt.logs) {
                for (const log of receipt.logs) {
                    try {
                        // Find matching event in ABI
                        for (const item of abi) {
                            if (item.type === 'event') {
                                const signature = `${item.name}(${item.inputs.map(i => i.type).join(',')})`;
                                const hash = this.web3.utils.keccak256(signature);

                                if (log.topics[0] === hash) {
                                    const decoded = this.web3.eth.abi.decodeLog(
                                        item.inputs,
                                        log.data,
                                        log.topics.slice(1)
                                    );

                                    events.push({
                                        event: item.name,
                                        args: decoded
                                    });
                                    break;
                                }
                            }
                        }
                    } catch (error) {
                        logger.warn('Failed to parse event:', error.message);
                    }
                }
            }

            return events;
        } catch (error) {
            logger.error('Parse events error:', error.message);
            return [];
        }
    }

    /**
     * Get view methods from ABI
     * @param {Array} abi - Contract ABI
     * @returns {Array} View method names
     */
    getViewMethods(abi) {
        return abi
            .filter(item =>
                item.type === 'function' &&
                (item.stateMutability === 'view' || item.stateMutability === 'pure') &&
                item.inputs.length === 0
            )
            .map(item => item.name);
    }
}

module.exports = new ContractCallService();
