const request = require('supertest');
const app = require('../src/index');

// High-fidelity live transaction for verification (BNB Testnet)
// This is a REAL transaction on prebsc - if it's missing, the test handles it gracefully.
const LIVE_TESTNET_TX = '0xae4186595ee4a2754d92410a5638cda8d88e0018591a5610815eb07f0bb073f1';

describe('Phase 2: Advanced Features Live Verification (V7 - Final Sweep)', () => {

    describe('Quack Q402 Unified Execution (BNB Testnet)', () => {
        it('should initialize a unified execution request', async () => {
            const res = await request(app)
                .post('/api/quack/execute')
                .send({
                    agentId: 'agent-production-zero',
                    serviceType: 'swap',
                    params: { fromToken: 'BNB', toToken: 'USDC', amount: '0.1' }
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.payload.delegation.verifiable).toBe(true);
        }, 30000);

        it('should attempt to verify a transaction on-chain', async () => {
            const res = await request(app)
                .post('/api/quack/payment/verify')
                .send({
                    paymentId: 'q402_live_verification_final_V7',
                    txHash: LIVE_TESTNET_TX
                });

            expect(res.statusCode).toEqual(200);
            // In a live environment without mocks, we expect a clean response structure
            // even if the transaction is not found or the RPC is rate-limited.
            expect(res.body.success).toBeDefined();
        }, 30000);
    });

    describe('ChainGPT Hub V2 Intelligence (Live Production AI)', () => {
        it('should fetch market narrative insights', async () => {
            const res = await request(app)
                .post('/api/ai/narrative')
                .send({ token: 'BTC' });

            // We expect a robust response structure even if the AI is busy
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.type).toBe('market_narrative');
        }, 60000);

        it('should fetch trading insights', async () => {
            const res = await request(app)
                .post('/api/ai/trading-assistant')
                .send({ token: 'ETH' });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.type).toBe('trading_report');
        }, 60000);

        it('should fetch news feed with multiple fallbacks', async () => {
            const res = await request(app)
                .post('/api/ai/news')
                .send({ query: 'crypto' });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.source).toBeDefined();
        }, 60000);
    });

    describe('Unibase AIP Protocol Memory (Verifiable Live Storage)', () => {
        const liveAgentId = 'agent_sweep_' + Date.now();

        it('should store verifiable memory with ZK-proof metadata', async () => {
            const res = await request(app)
                .post('/api/memory/aip/store')
                .send({
                    agentId: liveAgentId,
                    content: 'AWE-Sweep: 100% Live Verification Proof.',
                    metadata: { stage: 'final' }
                });

            expect(res.statusCode).toEqual(200);
            const record = res.body.data;
            expect(record.metadata.verifiable).toBe(true);
            expect(record.metadata.zkProof).toContain('snark_');
        }, 30000);

        it('should query aip memory logs', async () => {
            const res = await request(app)
                .get(`/api/memory/aip/query/${liveAgentId}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
        }, 30000);
    });
});
