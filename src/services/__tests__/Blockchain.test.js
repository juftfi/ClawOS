const BlockchainService = require('../blockchain/BlockchainService');

// Mock Web3
// Mock Web3
jest.mock('web3', () => {
    return {
        Web3: jest.fn().mockImplementation(() => ({
            eth: {
                getBalance: jest.fn(),
                getBlockNumber: jest.fn(),
                getGasPrice: jest.fn(),
                getTransaction: jest.fn(),
                estimateGas: jest.fn(),
                getTransactionReceipt: jest.fn(),
                getChainId: jest.fn(),
                net: {
                    getPeerCount: jest.fn()
                },
                accounts: {
                    privateKeyToAccount: jest.fn(() => ({
                        address: '0x1234567890123456789012345678901234567890',
                        privateKey: '0x0123456789012345678901234567890123456789012345678901234567890123'
                    })),
                    wallet: {
                        add: jest.fn()
                    }
                }
            },
            utils: {
                toWei: jest.fn((value, unit) => (parseFloat(value) * 1e18).toString()),
                fromWei: jest.fn((value, unit) => {
                    if (unit === 'gwei') return (parseFloat(value) / 1e9).toString();
                    return (parseFloat(value) / 1e18).toString();
                }),
                isAddress: jest.fn((address) => /^0x[a-fA-F0-9]{40}$/.test(address)),
                keccak256: jest.fn((data) => '0x' + '0'.repeat(64))
            }
        }))
    };
});

describe('Blockchain Service', () => {
    let web3Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        web3Mock = BlockchainService.getWeb3();
    });

    describe('getBalance', () => {
        it('should get wallet balance', async () => {
            const mockBalance = '1000000000000000000'; // 1 BNB in Wei
            web3Mock.eth.getBalance.mockResolvedValue(mockBalance);
            web3Mock.utils.isAddress.mockReturnValue(true);

            const result = await BlockchainService.getBalance('0x1234567890123456789012345678901234567890');

            expect(result).toHaveProperty('balance_wei');
            expect(result).toHaveProperty('balance_bnb');
            expect(result).toHaveProperty('balance_formatted');
            expect(web3Mock.eth.getBalance).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890');
        });

        it('should handle invalid address', async () => {
            web3Mock.utils.isAddress.mockReturnValue(false);

            await expect(BlockchainService.getBalance('invalid-address'))
                .rejects.toThrow('Failed to get balance: Invalid wallet address format');
        });

        it('should handle network errors', async () => {
            web3Mock.utils.isAddress.mockReturnValue(true);
            web3Mock.eth.getBalance.mockRejectedValue(new Error('Network error'));

            await expect(BlockchainService.getBalance('0x1234567890123456789012345678901234567890'))
                .rejects.toThrow('Failed to get balance: Network error');
        });
    });

    describe('getGasPrice', () => {
        it('should get current gas price', async () => {
            const mockGasPrice = '5000000000'; // 5 Gwei in Wei
            web3Mock.eth.getGasPrice.mockResolvedValue(mockGasPrice);

            const result = await BlockchainService.getGasPrice();

            expect(result).toHaveProperty('wei');
            expect(result).toHaveProperty('gwei');
            expect(result).toHaveProperty('formatted');
            expect(web3Mock.eth.getGasPrice).toHaveBeenCalled();
        });
    });

    describe('estimateGas', () => {
        it('should estimate gas for transaction', async () => {
            const mockGasEstimate = 21000;
            const mockGasPrice = '5000000000';

            web3Mock.eth.estimateGas.mockResolvedValue(mockGasEstimate);
            web3Mock.eth.getGasPrice.mockResolvedValue(mockGasPrice);

            const transaction = {
                from: '0x1234567890123456789012345678901234567890',
                to: '0x0987654321098765432109876543210987654321',
                value: '1000000000000000000'
            };

            const result = await BlockchainService.estimateGas(transaction);

            expect(result).toHaveProperty('gas_limit');
            expect(result).toHaveProperty('gas_price_gwei');
            expect(result).toHaveProperty('estimated_cost_wei');
            expect(result).toHaveProperty('estimated_cost_bnb');
            expect(result.gas_limit).toBe(mockGasEstimate.toString());
        });

        it('should handle gas estimation errors', async () => {
            web3Mock.eth.estimateGas.mockRejectedValue(new Error('Estimation failed'));

            const transaction = {
                from: '0x1234567890123456789012345678901234567890',
                to: '0x0987654321098765432109876543210987654321'
            };

            await expect(BlockchainService.estimateGas(transaction))
                .rejects.toThrow();
        });
    });

    describe('validateAddress', () => {
        it('should validate correct address', () => {
            web3Mock.utils.isAddress.mockReturnValue(true);

            const result = BlockchainService.validateAddress('0x1234567890123456789012345678901234567890');

            expect(result).toBe(true);
        });

        it('should reject invalid address', () => {
            web3Mock.utils.isAddress.mockReturnValue(false);

            const result = BlockchainService.validateAddress('invalid');

            expect(result).toBe(false);
        });
    });

    describe('getTransaction', () => {
        it('should get transaction details', async () => {
            const mockTx = {
                hash: '0xabc123',
                from: '0x1234567890123456789012345678901234567890',
                to: '0x0987654321098765432109876543210987654321',
                value: '1000000000000000000',
                gas: 21000,
                gasPrice: '5000000000',
                blockNumber: 12345
            };

            web3Mock.eth.getTransaction.mockResolvedValue(mockTx);

            const result = await BlockchainService.getTransaction('0xabc123');

            expect(result).toHaveProperty('hash');
            expect(result).toHaveProperty('from');
            expect(result).toHaveProperty('to');
            expect(result.hash).toBe('0xabc123');
        });

        it('should handle transaction not found', async () => {
            web3Mock.eth.getTransaction.mockResolvedValue(null);

            await expect(BlockchainService.getTransaction('0xinvalid'))
                .rejects.toThrow('Transaction not found');
        });
    });

    describe('getNetworkInfo', () => {
        it('should get network information', async () => {
            web3Mock.eth.getBlockNumber.mockResolvedValue(12345678);
            web3Mock.eth.getGasPrice.mockResolvedValue('5000000000');
            web3Mock.eth.getChainId.mockResolvedValue(97n);
            web3Mock.eth.net.getPeerCount.mockResolvedValue(10);

            const result = await BlockchainService.getNetworkInfo();

            expect(result).toHaveProperty('chain_id');
            expect(result).toHaveProperty('block_number');
            expect(result).toHaveProperty('gas_price_gwei');
            expect(result.chain_id).toBe(97);
        });
    });

    describe('waitForConfirmation', () => {
        beforeEach(() => {
            // Mock sleep to resolve immediately to avoid timeouts
            jest.spyOn(BlockchainService, 'sleep').mockResolvedValue();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should wait for transaction confirmation', async () => {
            const mockReceipt = {
                transactionHash: '0xabc123',
                blockNumber: 12345,
                status: true,
                gasUsed: 21000
            };

            web3Mock.eth.getTransactionReceipt
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(mockReceipt);

            web3Mock.eth.getBlockNumber.mockResolvedValue(12350);

            const result = await BlockchainService.waitForConfirmation('0xabc123', 1, 5000);

            expect(result).toHaveProperty('tx_hash');
            expect(result.status).toBe('success');
        });

        it('should timeout if confirmation takes too long', async () => {
            web3Mock.eth.getTransactionReceipt.mockResolvedValue(null);

            // We need to ensure the loop terminates. 
            // Since sleep is mocked, the loop will run very fast.
            // BlockchainService has a maxAttempts of 60.
            // So it should throw timeout eventually.

            await expect(BlockchainService.waitForConfirmation('0xabc123', 1))
                .rejects.toThrow('Transaction confirmation timeout');
        });
    });

    describe('hasSufficientBalance', () => {
        it('should return true when balance is sufficient', async () => {
            const mockBalance = '2000000000000000000'; // 2 BNB
            web3Mock.eth.getBalance.mockResolvedValue(mockBalance);

            const result = await BlockchainService.hasSufficientBalance(
                '0x1234567890123456789012345678901234567890',
                '1000000000000000000' // 1 BNB
            );

            expect(result).toBe(true);
        });

        it('should return false when balance is insufficient', async () => {
            const mockBalance = '500000000000000000'; // 0.5 BNB
            web3Mock.eth.getBalance.mockResolvedValue(mockBalance);

            const result = await BlockchainService.hasSufficientBalance(
                '0x1234567890123456789012345678901234567890',
                '1000000000000000000' // 1 BNB
            );

            expect(result).toBe(false);
        });
    });
});
