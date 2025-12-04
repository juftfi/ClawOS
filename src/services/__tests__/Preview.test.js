const PreviewService = require('../preview/PreviewService');
const RiskAssessmentService = require('../risk/RiskAssessmentService');
const BlockchainService = require('../blockchain/BlockchainService');
const MembaseService = require('../memory/MembaseService');

// Mock dependencies
jest.mock('../risk/RiskAssessmentService');
jest.mock('../blockchain/BlockchainService');
jest.mock('../memory/MembaseService');

describe('Preview Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generatePreview', () => {
        it('should generate a transaction preview successfully', async () => {
            const mockTx = {
                action: 'transfer',
                from: '0x123',
                to: '0x456',
                amount: '1.0',
                gas_estimate: {
                    estimated_cost_bnb: '0.001',
                    gas_limit: '21000',
                    gas_price_gwei: '5'
                },
                user_id: 'user1'
            };

            const mockRisk = {
                risk_level: 'LOW',
                risks: [],
                recommendations: [],
                can_execute: true
            };

            const mockHistory = {
                available: true,
                amount_stats: { average: '0.5', min: '0.1', max: '1.0' },
                gas_stats: { average_cost_bnb: '0.001' }
            };

            RiskAssessmentService.assessTransaction.mockResolvedValue(mockRisk);
            MembaseService.queryMemory.mockResolvedValue([
                { amount: '0.5', gas_cost_bnb: '0.001', timestamp: '2023-01-01' }
            ]);
            BlockchainService.getWeb3.mockReturnValue({
                utils: { fromWei: jest.fn(), toWei: jest.fn() }
            });

            const result = await PreviewService.generatePreview(mockTx);

            expect(result).toHaveProperty('summary');
            expect(result).toHaveProperty('details');
            expect(result).toHaveProperty('costs');
            expect(result.risk_level).toBe('LOW');
            expect(result.historical_comparison.available).toBe(true);
        });

        it('should handle errors during preview generation', async () => {
            const mockTx = { action: 'transfer' };
            RiskAssessmentService.assessTransaction.mockRejectedValue(new Error('Risk check failed'));

            await expect(PreviewService.generatePreview(mockTx))
                .rejects.toThrow('Failed to generate preview: Risk check failed');
        });
    });

    describe('calculateTotalCost', () => {
        it('should calculate total cost correctly', async () => {
            const gasEstimate = {
                estimated_cost_bnb: '0.001',
                gas_limit: '21000',
                gas_price_gwei: '5'
            };
            const amount = '1.0';

            const result = await PreviewService.calculateTotalCost(gasEstimate, amount);

            expect(result.amount_bnb).toBe('1.000000');
            expect(result.gas_cost_bnb).toBe('0.001000');
            expect(result.total_cost_bnb).toBe('1.001000');
        });
    });

    describe('getHistoricalComparison', () => {
        it('should return historical comparison data', async () => {
            const mockHistory = [
                { amount: '1.0', gas_cost_bnb: '0.001', timestamp: '2023-01-01' },
                { amount: '2.0', gas_cost_bnb: '0.002', timestamp: '2023-01-02' }
            ];

            MembaseService.queryMemory.mockResolvedValue(mockHistory);

            const result = await PreviewService.getHistoricalComparison('transfer', 'user1');

            expect(result.available).toBe(true);
            expect(result.transaction_count).toBe(2);
            expect(result.amount_stats.average).toBe('1.500000');
        });

        it('should handle no history found', async () => {
            MembaseService.queryMemory.mockResolvedValue([]);

            const result = await PreviewService.getHistoricalComparison('transfer', 'user1');

            expect(result.available).toBe(false);
            expect(result.message).toContain('No previous transfer transactions found');
        });
    });

    describe('formatTransaction', () => {
        it('should format transfer transaction', async () => {
            const txData = {
                action: 'transfer',
                from: '0x123',
                to: '0x456',
                amount: '1.0'
            };

            const result = await PreviewService.formatTransaction(txData);

            expect(result.action).toBe('Transfer');
            expect(result.amount).toBe('1.0 BNB');
        });

        it('should format swap transaction', async () => {
            const txData = {
                action: 'swap',
                from: '0x123',
                amount: '1.0',
                to_token: 'USDT'
            };

            const result = await PreviewService.formatTransaction(txData);

            expect(result.action).toBe('Token Swap');
            expect(result.to_token).toBe('USDT');
        });
    });

    describe('BNB Price', () => {
        it('should update and get BNB price', () => {
            PreviewService.updateBNBPrice(400);
            expect(PreviewService.getBNBPrice()).toBe(400);
        });
    });
});
