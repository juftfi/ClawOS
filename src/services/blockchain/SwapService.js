const blockchainService = require('./BlockchainService');
const logger = require('../../utils/logger');

class SwapService {
    constructor() {
        this.web3 = blockchainService.getWeb3();
        // PancakeSwap Router on BNB Testnet
        this.routerAddress = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1';
        this.factoryAddress = '0x6725F303b657a9451d8BA641348b6761A6CC7a17';
        this.WBNB = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd'; // Wrapped BNB on testnet
    }

    /**
     * Prepare swap transaction
     * @param {string} fromToken - Token to swap from (address or 'BNB')
     * @param {string} toToken - Token to swap to (address or 'BNB')
     * @param {string} amount - Amount to swap
     * @param {number} slippage - Slippage tolerance (default 0.5%)
     * @returns {Promise<Object>} Prepared swap transaction
     */
    async prepareSwap(fromToken, toToken, amount, slippage = 0.5) {
        try {
            const account = blockchainService.getAccount();

            // Convert 'BNB' to WBNB address
            const fromTokenAddress = fromToken === 'BNB' ? this.WBNB : fromToken;
            const toTokenAddress = toToken === 'BNB' ? this.WBNB : toToken;

            // Get router contract
            const routerContract = new this.web3.eth.Contract(
                this.getPancakeRouterABI(),
                this.routerAddress
            );

            // Get token decimals
            const fromDecimals = fromToken === 'BNB' ? 18 : await this.getTokenDecimals(fromTokenAddress);
            const toDecimals = toToken === 'BNB' ? 18 : await this.getTokenDecimals(toTokenAddress);

            // Convert amount to Wei
            const amountIn = this.web3.utils.toBigInt(
                parseFloat(amount) * Math.pow(10, fromDecimals)
            );

            // Get expected output amount
            const path = [fromTokenAddress, toTokenAddress];
            const amountsOut = await routerContract.methods
                .getAmountsOut(amountIn, path)
                .call();

            const expectedOutput = amountsOut[1];
            const minOutput = BigInt(expectedOutput) * BigInt(10000 - slippage * 100) / BigInt(10000);

            // Prepare transaction data
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

            let txData;
            if (fromToken === 'BNB') {
                // Swap BNB for tokens
                txData = routerContract.methods.swapExactETHForTokens(
                    minOutput.toString(),
                    path,
                    account.address,
                    deadline
                ).encodeABI();
            } else if (toToken === 'BNB') {
                // Swap tokens for BNB
                txData = routerContract.methods.swapExactTokensForETH(
                    amountIn.toString(),
                    minOutput.toString(),
                    path,
                    account.address,
                    deadline
                ).encodeABI();
            } else {
                // Swap tokens for tokens
                txData = routerContract.methods.swapExactTokensForTokens(
                    amountIn.toString(),
                    minOutput.toString(),
                    path,
                    account.address,
                    deadline
                ).encodeABI();
            }

            const transaction = {
                from: account.address,
                to: this.routerAddress,
                data: txData,
                value: fromToken === 'BNB' ? amountIn.toString() : '0'
            };

            const gasEstimate = await blockchainService.estimateGas(transaction);
            transaction.gas = gasEstimate.gas_limit;

            const gasPrice = await blockchainService.getGasPrice();
            transaction.gasPrice = gasPrice.wei;

            const expectedOutputFormatted = parseFloat(expectedOutput) / Math.pow(10, toDecimals);
            const minOutputFormatted = parseFloat(minOutput) / Math.pow(10, toDecimals);

            logger.info('Swap prepared', {
                fromToken,
                toToken,
                amountIn: amount,
                expectedOutput: expectedOutputFormatted
            });

            return {
                transaction,
                swap_details: {
                    from_token: fromToken,
                    to_token: toToken,
                    amount_in: amount,
                    expected_output: expectedOutputFormatted.toString(),
                    min_output: minOutputFormatted.toString(),
                    slippage: `${slippage}%`,
                    price_impact: this.calculatePriceImpact(amount, expectedOutputFormatted),
                    path,
                    deadline
                },
                gas_estimate: gasEstimate
            };
        } catch (error) {
            logger.error('Prepare swap error:', error.message);
            throw new Error(`Failed to prepare swap: ${error.message}`);
        }
    }

    /**
     * Execute swap transaction
     * @param {string} fromToken - Token to swap from
     * @param {string} toToken - Token to swap to
     * @param {string} amount - Amount to swap
     * @param {number} slippage - Slippage tolerance
     * @returns {Promise<Object>} Swap result
     */
    async executeSwap(fromToken, toToken, amount, slippage = 0.5) {
        try {
            const account = blockchainService.getAccount();

            // If swapping from token (not BNB), approve router first
            if (fromToken !== 'BNB') {
                await this.approveToken(fromToken, amount);
            }

            // Prepare swap
            const prepared = await this.prepareSwap(fromToken, toToken, amount, slippage);
            const transaction = prepared.transaction;

            // Get nonce
            const nonce = await this.web3.eth.getTransactionCount(account.address, 'pending');
            transaction.nonce = nonce;
            transaction.chainId = blockchainService.chainId;

            logger.info('Executing swap', { fromToken, toToken, amount });

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

            logger.info('Swap executed successfully', {
                txHash: receipt.transactionHash,
                gasUsed: gasUsed.toString()
            });

            return {
                tx_hash: receipt.transactionHash,
                status: receipt.status ? 'success' : 'failed',
                block_number: receipt.blockNumber.toString(),
                from_token: fromToken,
                to_token: toToken,
                from_amount: amount,
                to_amount: prepared.swap_details.expected_output,
                price_impact: prepared.swap_details.price_impact,
                gas_used: gasUsed.toString(),
                gas_cost_bnb: gasCostBNB,
                slippage: `${slippage}%`,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Execute swap error:', error.message);
            throw new Error(`Failed to execute swap: ${error.message}`);
        }
    }

    /**
     * Get swap price/quote
     * @param {string} fromToken - Token to swap from
     * @param {string} toToken - Token to swap to
     * @param {string} amount - Amount to swap
     * @returns {Promise<Object>} Price quote
     */
    async getSwapPrice(fromToken, toToken, amount) {
        try {
            const fromTokenAddress = fromToken === 'BNB' ? this.WBNB : fromToken;
            const toTokenAddress = toToken === 'BNB' ? this.WBNB : toToken;

            const routerContract = new this.web3.eth.Contract(
                this.getPancakeRouterABI(),
                this.routerAddress
            );

            const fromDecimals = fromToken === 'BNB' ? 18 : await this.getTokenDecimals(fromTokenAddress);
            const toDecimals = toToken === 'BNB' ? 18 : await this.getTokenDecimals(toTokenAddress);

            const amountIn = this.web3.utils.toBigInt(
                parseFloat(amount) * Math.pow(10, fromDecimals)
            );

            const path = [fromTokenAddress, toTokenAddress];
            const amountsOut = await routerContract.methods
                .getAmountsOut(amountIn, path)
                .call();

            const outputAmount = parseFloat(amountsOut[1]) / Math.pow(10, toDecimals);
            const rate = outputAmount / parseFloat(amount);

            return {
                from_token: fromToken,
                to_token: toToken,
                amount_in: amount,
                amount_out: outputAmount.toString(),
                exchange_rate: rate.toString(),
                price_impact: this.calculatePriceImpact(amount, outputAmount),
                path
            };
        } catch (error) {
            logger.error('Get swap price error:', error.message);
            throw new Error(`Failed to get swap price: ${error.message}`);
        }
    }

    /**
     * Approve token for router
     * @param {string} tokenAddress - Token contract address
     * @param {string} amount - Amount to approve
     * @returns {Promise<void>}
     */
    async approveToken(tokenAddress, amount) {
        try {
            const account = blockchainService.getAccount();
            const tokenContract = new this.web3.eth.Contract(
                this.getERC20ABI(),
                tokenAddress
            );

            const decimals = await this.getTokenDecimals(tokenAddress);
            const amountWei = this.web3.utils.toBigInt(
                parseFloat(amount) * Math.pow(10, decimals)
            );

            // Check current allowance
            const currentAllowance = await tokenContract.methods
                .allowance(account.address, this.routerAddress)
                .call();

            if (BigInt(currentAllowance) >= amountWei) {
                logger.info('Token already approved');
                return;
            }

            logger.info('Approving token for swap');

            const approveTx = tokenContract.methods.approve(
                this.routerAddress,
                amountWei.toString()
            );

            const gas = await approveTx.estimateGas({ from: account.address });
            const gasPrice = await blockchainService.getGasPrice();

            const transaction = {
                from: account.address,
                to: tokenAddress,
                data: approveTx.encodeABI(),
                gas: gas.toString(),
                gasPrice: gasPrice.wei,
                nonce: await this.web3.eth.getTransactionCount(account.address, 'pending'),
                chainId: blockchainService.chainId
            };

            const signedTx = await this.web3.eth.accounts.signTransaction(
                transaction,
                account.privateKey
            );

            await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            logger.info('Token approved successfully');
        } catch (error) {
            logger.error('Token approval error:', error.message);
            throw new Error(`Failed to approve token: ${error.message}`);
        }
    }

    /**
     * Get token decimals
     * @param {string} tokenAddress - Token contract address
     * @returns {Promise<number>} Token decimals
     */
    async getTokenDecimals(tokenAddress) {
        const tokenContract = new this.web3.eth.Contract(
            this.getERC20ABI(),
            tokenAddress
        );
        const decimals = await tokenContract.methods.decimals().call();
        return Number(decimals);
    }

    /**
     * Calculate price impact
     * @param {string} amountIn - Input amount
     * @param {string} amountOut - Output amount
     * @returns {string} Price impact percentage
     */
    calculatePriceImpact(amountIn, amountOut) {
        // Simplified price impact calculation
        const impact = Math.abs((parseFloat(amountOut) / parseFloat(amountIn) - 1) * 100);
        return `${impact.toFixed(2)}%`;
    }

    /**
     * Get PancakeSwap Router ABI
     * @returns {Array} Router ABI
     */
    getPancakeRouterABI() {
        return [
            {
                inputs: [
                    { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
                    { internalType: 'address[]', name: 'path', type: 'address[]' }
                ],
                name: 'getAmountsOut',
                outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }],
                stateMutability: 'view',
                type: 'function'
            },
            {
                inputs: [
                    { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' },
                    { internalType: 'address[]', name: 'path', type: 'address[]' },
                    { internalType: 'address', name: 'to', type: 'address' },
                    { internalType: 'uint256', name: 'deadline', type: 'uint256' }
                ],
                name: 'swapExactETHForTokens',
                outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }],
                stateMutability: 'payable',
                type: 'function'
            },
            {
                inputs: [
                    { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
                    { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' },
                    { internalType: 'address[]', name: 'path', type: 'address[]' },
                    { internalType: 'address', name: 'to', type: 'address' },
                    { internalType: 'uint256', name: 'deadline', type: 'uint256' }
                ],
                name: 'swapExactTokensForETH',
                outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }],
                stateMutability: 'nonpayable',
                type: 'function'
            },
            {
                inputs: [
                    { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
                    { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' },
                    { internalType: 'address[]', name: 'path', type: 'address[]' },
                    { internalType: 'address', name: 'to', type: 'address' },
                    { internalType: 'uint256', name: 'deadline', type: 'uint256' }
                ],
                name: 'swapExactTokensForTokens',
                outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }],
                stateMutability: 'nonpayable',
                type: 'function'
            }
        ];
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
                name: 'decimals',
                outputs: [{ name: '', type: 'uint8' }],
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

module.exports = new SwapService();
