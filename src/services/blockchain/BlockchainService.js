const { Web3 } = require('web3');
const logger = require('../../utils/logger');

class BlockchainService {
    constructor() {
        this.rpcUrl = process.env.BNB_TESTNET_RPC;
        this.chainId = parseInt(process.env.BNB_CHAIN_ID || '97');
        this.web3 = new Web3(this.rpcUrl);

        // Load wallet if private key is provided
        if (process.env.BNB_PRIVATE_KEY) {
            const privateKey = process.env.BNB_PRIVATE_KEY.startsWith('0x')
                ? process.env.BNB_PRIVATE_KEY
                : `0x${process.env.BNB_PRIVATE_KEY}`;
            this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
            this.web3.eth.accounts.wallet.add(this.account);
            logger.info(`Wallet loaded: ${this.account.address}`);
        }
    }

    /**
     * Get balance of an address
     * @param {string} address - Wallet address
     * @returns {Promise<Object>} Balance in BNB and Wei
     */
    async getBalance(address) {
        try {
            if (!this.validateAddress(address)) {
                throw new Error('Invalid wallet address format');
            }

            const balanceWei = await this.web3.eth.getBalance(address);
            const balanceBNB = this.web3.utils.fromWei(balanceWei, 'ether');

            logger.info(`Balance for ${address}: ${balanceBNB} BNB`);

            return {
                address,
                balance_wei: balanceWei.toString(),
                balance_bnb: balanceBNB,
                balance_formatted: `${parseFloat(balanceBNB).toFixed(6)} BNB`
            };
        } catch (error) {
            logger.error('Get balance error:', error.message);
            throw new Error(`Failed to get balance: ${error.message}`);
        }
    }

    /**
     * Estimate gas for a transaction
     * @param {Object} transaction - Transaction object
     * @returns {Promise<Object>} Gas estimate and cost
     */
    async estimateGas(transaction) {
        try {
            const gasEstimate = await this.web3.eth.estimateGas(transaction);
            const gasPrice = await this.getGasPrice();

            const gasCostWei = BigInt(gasEstimate) * BigInt(gasPrice.wei);
            const gasCostBNB = this.web3.utils.fromWei(gasCostWei.toString(), 'ether');

            logger.info(`Gas estimate: ${gasEstimate} units, Cost: ${gasCostBNB} BNB`);

            return {
                gas_limit: gasEstimate.toString(),
                gas_price_wei: gasPrice.wei,
                gas_price_gwei: gasPrice.gwei,
                estimated_cost_wei: gasCostWei.toString(),
                estimated_cost_bnb: gasCostBNB,
                estimated_cost_formatted: `${parseFloat(gasCostBNB).toFixed(6)} BNB`
            };
        } catch (error) {
            logger.error('Gas estimation error:', error.message);
            throw new Error(`Cannot estimate gas for this transaction: ${error.message}`);
        }
    }

    /**
     * Get current gas price
     * @returns {Promise<Object>} Gas price in Wei and Gwei
     */
    async getGasPrice() {
        try {
            const gasPriceWei = await this.web3.eth.getGasPrice();
            const gasPriceGwei = this.web3.utils.fromWei(gasPriceWei, 'gwei');

            return {
                wei: gasPriceWei.toString(),
                gwei: gasPriceGwei,
                formatted: `${parseFloat(gasPriceGwei).toFixed(2)} Gwei`
            };
        } catch (error) {
            logger.error('Get gas price error:', error.message);
            throw new Error(`Failed to get gas price: ${error.message}`);
        }
    }

    /**
     * Validate Ethereum/BNB address
     * @param {string} address - Address to validate
     * @returns {boolean} True if valid
     */
    validateAddress(address) {
        return this.web3.utils.isAddress(address);
    }

    /**
     * Wait for transaction confirmation
     * @param {string} txHash - Transaction hash
     * @param {number} confirmations - Number of confirmations to wait for
     * @returns {Promise<Object>} Transaction receipt
     */
    async waitForConfirmation(txHash, confirmations = 1) {
        try {
            logger.info(`Waiting for ${confirmations} confirmation(s) for tx: ${txHash}`);

            let receipt = null;
            let attempts = 0;
            const maxAttempts = 60; // 60 attempts * 3 seconds = 3 minutes max

            while (attempts < maxAttempts) {
                receipt = await this.web3.eth.getTransactionReceipt(txHash);

                if (receipt && receipt.blockNumber) {
                    const currentBlock = await this.web3.eth.getBlockNumber();
                    const confirmationCount = Number(currentBlock) - Number(receipt.blockNumber);

                    if (confirmationCount >= confirmations) {
                        logger.info(`Transaction confirmed with ${confirmationCount} confirmations`);
                        return {
                            tx_hash: txHash,
                            block_number: receipt.blockNumber.toString(),
                            confirmations: confirmationCount,
                            status: receipt.status ? 'success' : 'failed',
                            gas_used: receipt.gasUsed.toString(),
                            from: receipt.from,
                            to: receipt.to,
                            contract_address: receipt.contractAddress || null
                        };
                    }

                    logger.debug(`Waiting for confirmations: ${confirmationCount}/${confirmations}`);
                }

                await this.sleep(3000); // Wait 3 seconds
                attempts++;
            }

            throw new Error('Transaction confirmation timeout');
        } catch (error) {
            logger.error('Wait for confirmation error:', error.message);
            throw new Error(`Failed to confirm transaction: ${error.message}`);
        }
    }

    /**
     * Get transaction by hash
     * @param {string} txHash - Transaction hash
     * @returns {Promise<Object>} Transaction details
     */
    async getTransaction(txHash) {
        try {
            const tx = await this.web3.eth.getTransaction(txHash);
            const receipt = await this.web3.eth.getTransactionReceipt(txHash);

            if (!tx) {
                throw new Error('Transaction not found');
            }

            return {
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: this.web3.utils.fromWei(tx.value, 'ether'),
                gas: tx.gas?.toString(),
                gas_price: tx.gasPrice?.toString(),
                nonce: tx.nonce,
                block_number: tx.blockNumber?.toString(),
                status: receipt ? (receipt.status ? 'success' : 'failed') : 'pending',
                gas_used: receipt?.gasUsed?.toString()
            };
        } catch (error) {
            logger.error('Get transaction error:', error.message);
            throw new Error(`Failed to get transaction: ${error.message}`);
        }
    }

    /**
     * Get current block number
     * @returns {Promise<number>} Current block number
     */
    async getBlockNumber() {
        try {
            const blockNumber = await this.web3.eth.getBlockNumber();
            return Number(blockNumber);
        } catch (error) {
            logger.error('Get block number error:', error.message);
            throw new Error(`Failed to get block number: ${error.message}`);
        }
    }

    /**
     * Get network information
     * @returns {Promise<Object>} Network info
     */
    async getNetworkInfo() {
        try {
            const [chainId, blockNumber, gasPrice, peerCount] = await Promise.all([
                this.web3.eth.getChainId(),
                this.web3.eth.getBlockNumber(),
                this.web3.eth.getGasPrice(),
                this.web3.eth.net.getPeerCount().catch(() => 0)
            ]);

            return {
                chain_id: Number(chainId),
                network: chainId === 97n ? 'BNB Testnet' : chainId === 56n ? 'BNB Mainnet' : 'Unknown',
                block_number: Number(blockNumber),
                gas_price_gwei: this.web3.utils.fromWei(gasPrice, 'gwei'),
                peer_count: Number(peerCount),
                rpc_url: this.rpcUrl
            };
        } catch (error) {
            logger.error('Get network info error:', error.message);
            throw new Error(`Failed to get network info: ${error.message}`);
        }
    }

    /**
     * Check if account has sufficient balance
     * @param {string} address - Address to check
     * @param {string} requiredAmount - Required amount in Wei
     * @returns {Promise<boolean>} True if sufficient
     */
    async hasSufficientBalance(address, requiredAmount) {
        try {
            const balance = await this.web3.eth.getBalance(address);
            return BigInt(balance) >= BigInt(requiredAmount);
        } catch (error) {
            logger.error('Check balance error:', error.message);
            return false;
        }
    }

    /**
     * Retry with exponential backoff
     * @param {Function} fn - Function to retry
     * @param {number} maxRetries - Maximum retry attempts
     * @returns {Promise<any>} Function result
     */
    async retryWithBackoff(fn, maxRetries = 3) {
        let lastError;

        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                if (i < maxRetries - 1) {
                    const delay = Math.pow(2, i) * 1000; // Exponential backoff
                    logger.warn(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms`);
                    await this.sleep(delay);
                }
            }
        }

        throw lastError;
    }

    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get Web3 instance
     * @returns {Web3} Web3 instance
     */
    getWeb3() {
        return this.web3;
    }

    /**
     * Get account
     * @returns {Object} Account object
     */
    getAccount() {
        if (!this.account) {
            throw new Error('No wallet loaded. Please set BNB_PRIVATE_KEY in environment.');
        }
        return this.account;
    }
}

module.exports = new BlockchainService();
