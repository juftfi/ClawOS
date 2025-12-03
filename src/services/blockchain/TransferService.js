const blockchainService = require('./BlockchainService');
const logger = require('../../utils/logger');

class TransferService {
    constructor() {
        this.web3 = blockchainService.getWeb3();
    }

    /**
     * Prepare transfer transaction (without executing)
     * @param {string} from - Sender address
     * @param {string} to - Recipient address
     * @param {string} amount - Amount in BNB or tokens
     * @param {string} tokenAddress - Token contract address (null for native BNB)
     * @returns {Promise<Object>} Prepared transaction
     */
    async prepareTransfer(from, to, amount, tokenAddress = null) {
        try {
            if (!blockchainService.validateAddress(from)) {
                throw new Error('Invalid sender address format');
            }
            if (!blockchainService.validateAddress(to)) {
                throw new Error('Invalid recipient address format');
            }

            let transaction;

            if (!tokenAddress) {
                // Native BNB transfer
                const amountWei = this.web3.utils.toWei(amount, 'ether');

                transaction = {
                    from,
                    to,
                    value: amountWei,
                    gas: 21000 // Standard gas for BNB transfer
                };
            } else {
                // ERC20 token transfer
                if (!blockchainService.validateAddress(tokenAddress)) {
                    throw new Error('Invalid token address format');
                }

                const tokenContract = new this.web3.eth.Contract(
                    this.getERC20ABI(),
                    tokenAddress
                );

                const decimals = await tokenContract.methods.decimals().call();
                const amountWei = this.web3.utils.toBigInt(
                    parseFloat(amount) * Math.pow(10, Number(decimals))
                );

                const data = tokenContract.methods.transfer(to, amountWei).encodeABI();

                transaction = {
                    from,
                    to: tokenAddress,
                    data,
                    value: '0'
                };
            }

            // Estimate gas
            const gasEstimate = await blockchainService.estimateGas(transaction);
            transaction.gas = gasEstimate.gas_limit;

            // Get gas price
            const gasPrice = await blockchainService.getGasPrice();
            transaction.gasPrice = gasPrice.wei;

            logger.info('Transfer prepared', { from, to, amount, tokenAddress });

            return {
                transaction,
                gas_estimate: gasEstimate,
                transfer_type: tokenAddress ? 'token' : 'native',
                amount,
                token_address: tokenAddress
            };
        } catch (error) {
            logger.error('Prepare transfer error:', error.message);
            throw new Error(`Failed to prepare transfer: ${error.message}`);
        }
    }

    /**
     * Execute transfer transaction
     * @param {string} from - Sender address
     * @param {string} to - Recipient address
     * @param {string} amount - Amount in BNB or tokens
     * @param {string} tokenAddress - Token contract address (null for native BNB)
     * @returns {Promise<Object>} Transaction result
     */
    async executeTransfer(from, to, amount, tokenAddress = null) {
        try {
            const account = blockchainService.getAccount();

            if (account.address.toLowerCase() !== from.toLowerCase()) {
                throw new Error('Sender address does not match loaded wallet');
            }

            // Prepare transaction
            const prepared = await this.prepareTransfer(from, to, amount, tokenAddress);
            const transaction = prepared.transaction;

            // Check balance
            const balance = await blockchainService.getBalance(from);
            const totalCost = tokenAddress
                ? BigInt(prepared.gas_estimate.estimated_cost_wei)
                : BigInt(transaction.value) + BigInt(prepared.gas_estimate.estimated_cost_wei);

            if (BigInt(balance.balance_wei) < totalCost) {
                throw new Error('Not enough BNB for gas and transfer amount');
            }

            // Get nonce
            const nonce = await this.web3.eth.getTransactionCount(from, 'pending');
            transaction.nonce = nonce;
            transaction.chainId = blockchainService.chainId;

            logger.info('Executing transfer', { from, to, amount, nonce });

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

            logger.info('Transfer executed successfully', {
                txHash: receipt.transactionHash,
                gasUsed: gasUsed.toString()
            });

            return {
                tx_hash: receipt.transactionHash,
                status: receipt.status ? 'success' : 'failed',
                block_number: receipt.blockNumber.toString(),
                from: receipt.from,
                to: receipt.to,
                amount,
                gas_used: gasUsed.toString(),
                gas_cost_bnb: gasCostBNB,
                cost_formatted: `${parseFloat(gasCostBNB).toFixed(6)} BNB`,
                transfer_type: tokenAddress ? 'token' : 'native',
                token_address: tokenAddress,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Execute transfer error:', error.message);
            throw new Error(`Failed to execute transfer: ${error.message}`);
        }
    }

    /**
     * Transfer native BNB
     * @param {string} from - Sender address
     * @param {string} to - Recipient address
     * @param {string} amountInBNB - Amount in BNB
     * @returns {Promise<Object>} Transaction result
     */
    async transferNative(from, to, amountInBNB) {
        try {
            logger.info(`Transferring ${amountInBNB} BNB from ${from} to ${to}`);
            return await this.executeTransfer(from, to, amountInBNB, null);
        } catch (error) {
            logger.error('Native transfer error:', error.message);
            throw new Error(`Failed to transfer BNB: ${error.message}`);
        }
    }

    /**
     * Transfer ERC20 tokens
     * @param {string} from - Sender address
     * @param {string} to - Recipient address
     * @param {string} amount - Amount of tokens
     * @param {string} tokenAddress - Token contract address
     * @returns {Promise<Object>} Transaction result
     */
    async transferToken(from, to, amount, tokenAddress) {
        try {
            logger.info(`Transferring ${amount} tokens from ${from} to ${to}`);
            return await this.executeTransfer(from, to, amount, tokenAddress);
        } catch (error) {
            logger.error('Token transfer error:', error.message);
            throw new Error(`Failed to transfer tokens: ${error.message}`);
        }
    }

    /**
     * Batch transfer to multiple recipients
     * @param {string} from - Sender address
     * @param {Array} recipients - Array of {to, amount}
     * @param {string} tokenAddress - Token contract address (null for BNB)
     * @returns {Promise<Object>} Batch transfer results
     */
    async batchTransfer(from, recipients, tokenAddress = null) {
        try {
            const results = [];
            const errors = [];

            for (const recipient of recipients) {
                try {
                    const result = await this.executeTransfer(
                        from,
                        recipient.to,
                        recipient.amount,
                        tokenAddress
                    );
                    results.push(result);
                } catch (error) {
                    errors.push({
                        recipient: recipient.to,
                        amount: recipient.amount,
                        error: error.message
                    });
                }
            }

            return {
                successful: results.length,
                failed: errors.length,
                total: recipients.length,
                results,
                errors
            };
        } catch (error) {
            logger.error('Batch transfer error:', error.message);
            throw new Error(`Failed to execute batch transfer: ${error.message}`);
        }
    }

    /**
     * Get token balance
     * @param {string} tokenAddress - Token contract address
     * @param {string} walletAddress - Wallet address
     * @returns {Promise<Object>} Token balance
     */
    async getTokenBalance(tokenAddress, walletAddress) {
        try {
            const tokenContract = new this.web3.eth.Contract(
                this.getERC20ABI(),
                tokenAddress
            );

            const [balance, decimals, symbol, name] = await Promise.all([
                tokenContract.methods.balanceOf(walletAddress).call(),
                tokenContract.methods.decimals().call(),
                tokenContract.methods.symbol().call(),
                tokenContract.methods.name().call()
            ]);

            const balanceFormatted = parseFloat(balance) / Math.pow(10, Number(decimals));

            return {
                token_address: tokenAddress,
                wallet_address: walletAddress,
                balance_raw: balance.toString(),
                balance_formatted: balanceFormatted.toString(),
                decimals: Number(decimals),
                symbol,
                name
            };
        } catch (error) {
            logger.error('Get token balance error:', error.message);
            throw new Error(`Failed to get token balance: ${error.message}`);
        }
    }

    /**
     * Get ERC20 ABI
     * @returns {Array} ERC20 ABI
     */
    getERC20ABI() {
        return [
            {
                constant: true,
                inputs: [],
                name: 'name',
                outputs: [{ name: '', type: 'string' }],
                type: 'function'
            },
            {
                constant: true,
                inputs: [],
                name: 'symbol',
                outputs: [{ name: '', type: 'string' }],
                type: 'function'
            },
            {
                constant: true,
                inputs: [],
                name: 'decimals',
                outputs: [{ name: '', type: 'uint8' }],
                type: 'function'
            },
            {
                constant: true,
                inputs: [{ name: '_owner', type: 'address' }],
                name: 'balanceOf',
                outputs: [{ name: 'balance', type: 'uint256' }],
                type: 'function'
            },
            {
                constant: false,
                inputs: [
                    { name: '_to', type: 'address' },
                    { name: '_value', type: 'uint256' }
                ],
                name: 'transfer',
                outputs: [{ name: '', type: 'bool' }],
                type: 'function'
            },
            {
                constant: false,
                inputs: [
                    { name: '_spender', type: 'address' },
                    { name: '_value', type: 'uint256' }
                ],
                name: 'approve',
                outputs: [{ name: '', type: 'bool' }],
                type: 'function'
            },
            {
                constant: true,
                inputs: [
                    { name: '_owner', type: 'address' },
                    { name: '_spender', type: 'address' }
                ],
                name: 'allowance',
                outputs: [{ name: '', type: 'uint256' }],
                type: 'function'
            }
        ];
    }
}

module.exports = new TransferService();
