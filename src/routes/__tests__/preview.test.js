const request = require('supertest');
const express = require('express');
const previewRouter = require('../preview');
const previewService = require('../../services/preview/PreviewService');
const blockchainService = require('../../services/blockchain/BlockchainService');
const riskAssessmentService = require('../../services/risk/RiskAssessmentService');

// Mock dependencies
jest.mock('../../services/preview/PreviewService');
jest.mock('../../services/blockchain/BlockchainService');
jest.mock('../../services/risk/RiskAssessmentService');

const app = express();
app.use(express.json());
app.use('/api/preview', previewRouter);

describe('Preview Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/preview/transaction', () => {
        it('should generate transaction preview', async () => {
            const mockTx = { action: 'transfer', amount: '1.0' };
            const mockPreview = { summary: 'Transfer 1.0 BNB' };
            previewService.generatePreview.mockResolvedValue(mockPreview);

            const res = await request(app)
                .post('/api/preview/transaction')
                .send({ transaction: mockTx });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockPreview);
        });

        it('should validate required fields', async () => {
            const res = await request(app)
                .post('/api/preview/transaction')
                .send({});

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/preview/risks/:txHash', () => {
        it('should analyze transaction risks', async () => {
            const mockTx = { from: '0x1', to: '0x2', value: '100', gas: '21000', gas_price: '1000000000' };
            const mockAssessment = { risk_level: 'LOW' };

            blockchainService.getTransaction.mockResolvedValue(mockTx);
            blockchainService.getWeb3.mockReturnValue({
                utils: { fromWei: jest.fn().mockReturnValue('1') }
            });
            riskAssessmentService.assessTransaction.mockResolvedValue(mockAssessment);

            const res = await request(app)
                .get('/api/preview/risks/0x123');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.risk_assessment).toEqual(mockAssessment);
        });
    });

    describe('GET /api/preview/gas-prices', () => {
        it('should get gas prices', async () => {
            const mockGasPrice = { wei: '1000000000', gwei: '1', formatted: '1 Gwei' };
            const mockAvg = 1.0;

            blockchainService.getGasPrice.mockResolvedValue(mockGasPrice);
            riskAssessmentService.getAverageGasPrice.mockResolvedValue(mockAvg);
            blockchainService.getWeb3.mockReturnValue({
                utils: { fromWei: jest.fn().mockReturnValue('0.000021') }
            });

            const res = await request(app)
                .get('/api/preview/gas-prices');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.current.gwei).toBe('1');
        });
    });

    describe('POST /api/preview/simulate', () => {
        it('should simulate transaction', async () => {
            const mockTx = { action: 'transfer', from: '0x1' };
            const mockPreview = {
                can_execute: true,
                costs: { gas_limit: '21000', total_cost_bnb: '0.1' },
                risk_level: 'LOW'
            };
            const mockBalance = { balance_bnb: '1.0', balance_wei: '1000000000000000000' };

            previewService.generatePreview.mockResolvedValue(mockPreview);
            blockchainService.getBalance.mockResolvedValue(mockBalance);
            blockchainService.getWeb3.mockReturnValue({
                utils: { toWei: jest.fn().mockReturnValue('100000000000000000') }
            });

            const res = await request(app)
                .post('/api/preview/simulate')
                .send({ transaction: mockTx });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.simulation.will_succeed).toBe(true);
        });
    });

    describe('POST /api/preview/compare', () => {
        it('should compare transaction', async () => {
            const mockTx = { action: 'transfer', amount: '1.0' };
            const mockComparison = { available: true };
            const mockChart = { labels: [], values: [] };

            previewService.getHistoricalComparison.mockResolvedValue(mockComparison);
            previewService.generateComparisonChart.mockReturnValue(mockChart);

            const res = await request(app)
                .post('/api/preview/compare')
                .send({ transaction: mockTx, userId: 'user1' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.chart_data).toEqual(mockChart);
        });
    });

    describe('POST /api/preview/batch', () => {
        it('should preview batch transactions', async () => {
            const mockTxs = [{ action: 'transfer' }, { action: 'swap' }];
            const mockPreview = {
                costs: { total_cost_bnb: '0.1' },
                risk_level: 'LOW',
                can_execute: true
            };

            previewService.generatePreview.mockResolvedValue(mockPreview);

            const res = await request(app)
                .post('/api/preview/batch')
                .send({ transactions: mockTxs });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.transaction_count).toBe(2);
        });
    });

    describe('BNB Price', () => {
        it('should get BNB price', async () => {
            previewService.getBNBPrice.mockReturnValue(300);

            const res = await request(app)
                .get('/api/preview/bnb-price');

            expect(res.status).toBe(200);
            expect(res.body.data.bnb_usd).toBe(300);
        });

        it('should update BNB price', async () => {
            const res = await request(app)
                .post('/api/preview/bnb-price')
                .send({ price: 350 });

            expect(res.status).toBe(200);
            expect(res.body.data.bnb_usd).toBe(350);
            expect(previewService.updateBNBPrice).toHaveBeenCalledWith(350);
        });
    });
});
