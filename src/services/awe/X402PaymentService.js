const multiNetworkService = require('../blockchain/MultiNetworkService');
const logger = require('../../utils/logger');
const { parseUnits, formatUnits, encodeFunctionData } = require('viem');

// ERC-20 ABI for USDC transfers
const ERC20_ABI = [
    {
        "inputs": [{ "name": "recipient", "type": "address" }, { "name": "amount", "type": "uint256" }],
        "name": "transfer",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "account", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

/**
 * x402 Payment Service for Base Sepolia
 * Implements x402 payment protocol for AI agent services with REAL USDC transfers
 */
class X402PaymentService {
    constructor() {
        this.network = 'base-sepolia';
        this.usdcAddress = process.env.BASE_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
        this.payments = [];
        this.servicePricing = {
            'agent-creation': '1000000', // 1 USDC
            'agent-query': '100000',     // 0.1 USDC
            'agent-action': '500000',    // 0.5 USDC
            // Common aliases and additional service types
            'transfer': '250000',        // 0.25 USDC (alias)
            'swap': '500000',            // 0.5 USDC
            'contract-deploy': '2000000',// 2 USDC
            'deploy': '2000000'          // alias for contract-deploy
        };
    }

    createPaymentRequest(agentId, serviceType, metadata = {}) {
        try {
            const amount = this.servicePricing[serviceType];
            if (!amount) throw new Error(`Unknown service type: ${serviceType}`);

            const config = multiNetworkService.getNetworkConfig(this.network);

            const paymentRequest = {
                paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                agentId, serviceType, amount,
                token: this.usdcAddress,
                recipient: config.walletAddress,
                network: this.network,
                chainId: config.chainId,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                status: 'pending',
                metadata
            };

            logger.info('x402 payment request created', {
                paymentId: paymentRequest.paymentId,
                agentId, serviceType,
                amount: formatUnits(BigInt(amount), 6) + ' USDC'
            });

            return {
                success: true,
                paymentRequest,
                paymentDetails: {
                    amount: formatUnits(BigInt(amount), 6),
                    token: 'USDC',
                    tokenAddress: this.usdcAddress,
                    recipient: config.walletAddress,
                    network: 'Base Sepolia',
                    chainId: config.chainId
                }
            };
        } catch (error) {
            logger.error('Create payment request error:', error.message);
            throw new Error(`Failed to create payment request: ${error.message}`);
        }
    }

    async executeUSDCTransfer(fromAddress, amount, serviceType) {
        try {
            multiNetworkService.switchNetwork(this.network);
            const clients = multiNetworkService.getViemClients(this.network);
            const config = multiNetworkService.getNetworkConfig(this.network);

            // Check USDC balance
            const balanceData = encodeFunctionData({
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [config.walletAddress]
            });

            const balance = await clients.public.call({
                to: this.usdcAddress,
                data: balanceData
            });

            logger.info('USDC balance check', {
                wallet: config.walletAddress,
                balance: balance ? formatUnits(BigInt(balance.data), 6) + ' USDC' : '0 USDC'
            });

            // Execute USDC transfer
            const transferData = encodeFunctionData({
                abi: ERC20_ABI,
                functionName: 'transfer',
                args: [config.walletAddress, BigInt(amount)]
            });

            const hash = await clients.wallet.sendTransaction({
                to: this.usdcAddress,
                data: transferData,
                gas: 100000n
            });

            const receipt = await clients.public.waitForTransactionReceipt({ hash });

            const payment = {
                paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                txHash: hash,
                from: fromAddress,
                to: config.walletAddress,
                amount,
                token: this.usdcAddress,
                serviceType,
                status: receipt.status === 'success' ? 'confirmed' : 'failed',
                blockNumber: receipt.blockNumber.toString(),
                confirmedAt: new Date().toISOString(),
                network: this.network
            };

            this.payments.push(payment);

            logger.info('USDC transfer executed', {
                paymentId: payment.paymentId,
                txHash: hash,
                amount: formatUnits(BigInt(amount), 6) + ' USDC',
                status: payment.status
            });

            return { success: true, payment };
        } catch (error) {
            logger.error('USDC transfer error:', error.message);
            throw new Error(`Failed to execute USDC transfer: ${error.message}`);
        }
    }

    async verifyPayment(paymentId, txHash) {
        try {
            multiNetworkService.switchNetwork(this.network);
            const web3 = multiNetworkService.getWeb3(this.network);

            const receipt = await web3.eth.getTransactionReceipt(txHash);

            if (!receipt) throw new Error('Transaction not found');
            if (!receipt.status) throw new Error('Transaction failed');

            const payment = {
                paymentId, txHash,
                status: 'confirmed',
                blockNumber: receipt.blockNumber.toString(),
                confirmedAt: new Date().toISOString(),
                network: this.network
            };

            this.payments.push(payment);

            logger.info('x402 payment verified', { paymentId, txHash, blockNumber: receipt.blockNumber });

            return { success: true, verified: true, payment };
        } catch (error) {
            logger.error('Verify payment error:', error.message);
            return { success: false, verified: false, error: error.message };
        }
    }

    async acceptPayment(agentId, serviceType, payer, executeTransfer = false) {
        try {
            const amount = this.servicePricing[serviceType];
            if (!amount) throw new Error(`Unknown service type: ${serviceType}`);

            const config = multiNetworkService.getNetworkConfig(this.network);

            let payment = {
                paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                agentId, serviceType, amount,
                token: this.usdcAddress,
                payer,
                recipient: config.walletAddress,
                network: this.network,
                status: 'accepted',
                acceptedAt: new Date().toISOString()
            };

            if (executeTransfer) {
                const transferResult = await this.executeUSDCTransfer(payer, amount, serviceType);
                payment = { ...payment, ...transferResult.payment };
            }

            this.payments.push(payment);

            logger.info('x402 payment accepted', {
                paymentId: payment.paymentId,
                agentId, serviceType,
                amount: formatUnits(BigInt(amount), 6) + ' USDC',
                payer,
                realTransfer: executeTransfer
            });

            return {
                success: true,
                payment: {
                    paymentId: payment.paymentId,
                    amount: formatUnits(BigInt(amount), 6) + ' USDC',
                    serviceType,
                    status: payment.status,
                    network: this.network,
                    txHash: payment.txHash || null,
                    realTransfer: executeTransfer
                }
            };
        } catch (error) {
            logger.error('Accept payment error:', error.message);
            throw new Error(`Failed to accept payment: ${error.message}`);
        }
    }

    getPaymentHistory(agentId) {
        return this.payments.filter(p => p.agentId === agentId);
    }

    getAllPayments() {
        return this.payments;
    }

    getPricing() {
        const pricing = {};
        for (const [service, amount] of Object.entries(this.servicePricing)) {
            pricing[service] = {
                amount: formatUnits(BigInt(amount), 6),
                token: 'USDC',
                network: 'Base Sepolia'
            };
        }
        return pricing;
    }

    updatePricing(serviceType, amount) {
        this.servicePricing[serviceType] = amount;
        logger.info('Service pricing updated', {
            serviceType,
            amount: formatUnits(BigInt(amount), 6) + ' USDC'
        });
    }

    getStatistics() {
        const totalPayments = this.payments.length;
        const confirmedPayments = this.payments.filter(p => p.status === 'confirmed').length;
        const acceptedPayments = this.payments.filter(p => p.status === 'accepted').length;

        return {
            totalPayments,
            confirmedPayments,
            acceptedPayments,
            network: this.network,
            usdcAddress: this.usdcAddress
        };
    }
}

module.exports = new X402PaymentService();
