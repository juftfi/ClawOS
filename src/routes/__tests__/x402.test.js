const request = require('supertest');
const express = require('express');
const x402Router = require('../x402');

jest.mock('../../services/x402/PaymentService');
jest.mock('../../services/x402/PolicyService');
jest.mock('../../services/x402/SignatureService');

const app = express();
app.use(express.json());
// Mount routes exactly as they are in index.js but relative to the test app
// In index.js: app.use('/api/payment', x402Router);
// But x402.js defines routes like /prepare, so full path is /api/payment/prepare
// However, x402.js also defines /policy routes.
// To match index.js structure where x402Router is used for multiple paths:
app.use('/api/payment', x402Router);
app.use('/api/policy', x402Router);
app.use('/api/signature', x402Router);

app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        success: false,
        error: err.message
    });
});

describe('x402 Payment Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/payment/prepare', () => {
        it('should prepare payment', async () => {
            const PaymentService = require('../../services/x402/PaymentService');

            PaymentService.preparePayment = jest.fn().mockResolvedValue({
                success: true,
                payment: { amount: '1', recipient: '0x123' },
                gas_estimate: { gas_limit: 21000 }
            });

            const response = await request(app)
                .post('/api/payment/prepare')
                .send({
                    amount: '1',
                    recipient: '0x1234567890123456789012345678901234567890',
                    metadata: { user_id: 'user123' }
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('POST /api/policy/set-limit', () => {
        it('should set spending limit', async () => {
            const PaymentService = require('../../services/x402/PaymentService');

            PaymentService.createPaymentPolicy = jest.fn().mockResolvedValue({
                success: true,
                user_id: 'user123',
                policy: {
                    max_daily_spend: '10'
                }
            });

            const response = await request(app)
                .post('/api/policy/policy/set-limit')
                .send({
                    userId: 'user123',
                    limitBNB: '10'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });
});
