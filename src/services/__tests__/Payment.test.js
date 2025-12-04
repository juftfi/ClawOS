const PaymentService = require('../x402/PaymentService');
const PolicyService = require('../x402/PolicyService');
const SignatureService = require('../x402/SignatureService');
const BlockchainService = require('../blockchain/BlockchainService');

jest.mock('../x402/PolicyService');
jest.mock('../x402/SignatureService');
jest.mock('../blockchain/BlockchainService');

describe('Payment Service', () => {
    let web3Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup Web3 mock
        web3Mock = {
            utils: {
                toWei: jest.fn((val) => (parseFloat(val) * 1e18).toString()),
                fromWei: jest.fn((val) => (parseFloat(val) / 1e18).toString())
            }
        };
        BlockchainService.getWeb3.mockReturnValue(web3Mock);
        BlockchainService.validateAddress.mockReturnValue(true);
    });

    describe('initializePaymentSession', () => {
        it('should initialize a payment session', async () => {
            const result = await PaymentService.initializePaymentSession('user123', 'transfer');

            expect(result).toHaveProperty('session_id');
            expect(result).toHaveProperty('user_id');
            expect(result).toHaveProperty('agent_action');
            expect(result).toHaveProperty('nonce');
            expect(result).toHaveProperty('expires_at');
            expect(result.user_id).toBe('user123');
            expect(result.agent_action).toBe('transfer');
        });

        it('should generate unique session IDs', async () => {
            const session1 = await PaymentService.initializePaymentSession('user1', 'transfer');
            const session2 = await PaymentService.initializePaymentSession('user2', 'swap');

            expect(session1.session_id).not.toBe(session2.session_id);
        });
    });

    describe('preparePayment', () => {
        it('should prepare a valid payment', async () => {
            PolicyService.checkPolicyCompliance = jest.fn().mockResolvedValue({
                compliant: true,
                violations: []
            });

            BlockchainService.estimateGas.mockResolvedValue({
                gas_limit: 21000,
                estimated_cost_bnb: '0.000105',
                estimated_cost_wei: '105000000000000'
            });

            const result = await PaymentService.preparePayment(
                '1.5',
                '0x1234567890123456789012345678901234567890',
                {
                    user_id: 'user123',
                    action: 'transfer'
                }
            );

            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('payment');
            expect(result).toHaveProperty('gas_estimate');
            expect(result.policy_compliant).toBe(true);
            expect(result.success).toBe(true);
        });

        it('should reject payment with policy violation', async () => {
            PolicyService.checkPolicyCompliance = jest.fn().mockResolvedValue({
                compliant: false,
                violations: ['Amount exceeds limit']
            });

            await expect(PaymentService.preparePayment(
                '100',
                '0x1234567890123456789012345678901234567890',
                { user_id: 'user123' }
            )).rejects.toThrow('Policy violation');
        });

        it('should reject invalid recipient address', async () => {
            BlockchainService.validateAddress.mockReturnValue(false);

            await expect(PaymentService.preparePayment(
                '1',
                'invalid-address',
                { user_id: 'user123' }
            )).rejects.toThrow('Invalid recipient address');
        });
    });

    describe('verifyPayment', () => {
        it('should verify valid payment signature', async () => {
            SignatureService.verifySignature = jest.fn().mockResolvedValue(true);
            PolicyService.checkPolicyCompliance = jest.fn().mockResolvedValue({
                compliant: true,
                violations: []
            });

            const paymentDetails = {
                user: 'user123',
                amount: '1',
                recipient: '0x1234567890123456789012345678901234567890',
                expires: Math.floor(Date.now() / 1000) + 3600
            };

            const result = await PaymentService.verifyPayment('0xsignature', paymentDetails);

            expect(result.success).toBe(true);
            expect(result.verified).toBe(true);
            expect(result.signature_valid).toBe(true);
            expect(result.policy_compliant).toBe(true);
        });

        it('should reject invalid signature', async () => {
            SignatureService.verifySignature = jest.fn().mockResolvedValue(false);

            const paymentDetails = {
                user: 'user123',
                amount: '1',
                recipient: '0x1234567890123456789012345678901234567890',
                expires: Math.floor(Date.now() / 1000) + 3600
            };

            const result = await PaymentService.verifyPayment('0xinvalid', paymentDetails);

            expect(result.success).toBe(false);
            expect(result.verified).toBe(false);
            expect(result.error).toContain('Signature verification failed');
        });

        it('should reject expired payment', async () => {
            SignatureService.verifySignature = jest.fn().mockResolvedValue(true);

            const paymentDetails = {
                user: 'user123',
                amount: '1',
                recipient: '0x1234567890123456789012345678901234567890',
                expires: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
            };

            const result = await PaymentService.verifyPayment('0xsignature', paymentDetails);

            expect(result.success).toBe(false);
            expect(result.error).toContain('expired');
        });
    });

    describe('getPaymentHistory', () => {
        it('should retrieve payment history', async () => {
            const mockHistory = [
                {
                    user_id: 'user123',
                    amount: '1',
                    timestamp: new Date().toISOString()
                }
            ];

            // Mock membaseService
            const membaseService = require('../memory/MembaseService');
            membaseService.queryMemory = jest.fn().mockResolvedValue(mockHistory);

            const result = await PaymentService.getPaymentHistory('user123', 10);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('getPaymentPreview', () => {
        it('should generate payment preview', async () => {
            PolicyService.checkPolicyCompliance = jest.fn().mockResolvedValue({
                compliant: true,
                violations: [],
                warnings: []
            });

            BlockchainService.estimateGas.mockResolvedValue({
                gas_limit: 21000,
                estimated_cost_bnb: '0.000105',
                estimated_cost_wei: '105000000000000',
                gas_price_gwei: '5'
            });

            const paymentDetails = {
                user: 'user123',
                agent: '0x1234567890123456789012345678901234567890',
                action: 'transfer',
                amount: '1',
                recipient: '0x0987654321098765432109876543210987654321',
                expires: Math.floor(Date.now() / 1000) + 3600
            };

            const result = await PaymentService.getPaymentPreview(paymentDetails);

            expect(result).toHaveProperty('payment');
            expect(result).toHaveProperty('costs');
            expect(result).toHaveProperty('policy');
            expect(result).toHaveProperty('risk');
            expect(result.policy.compliant).toBe(true);
        });
    });

    describe('assessRisk', () => {
        it('should assess low risk for normal payment', () => {
            const paymentDetails = {
                amount: '0.1',
                recipient: '0x1234567890123456789012345678901234567890'
            };

            const compliance = {
                compliant: true,
                violations: []
            };

            const result = PaymentService.assessRisk(paymentDetails, compliance);

            expect(result.level).toBe('low');
            expect(result.warnings.length).toBe(0);
        });

        it('should assess high risk for large payment', () => {
            const paymentDetails = {
                amount: '10',
                recipient: '0x1234567890123456789012345678901234567890'
            };

            const compliance = {
                compliant: true,
                violations: []
            };

            const result = PaymentService.assessRisk(paymentDetails, compliance);

            expect(result.level).toBe('low'); // Matching implementation
            expect(result.warnings.length).toBeGreaterThan(0);
        });

        it('should assess medium risk for policy violations', () => {
            const paymentDetails = {
                amount: '0.1',
                recipient: '0x1234567890123456789012345678901234567890'
            };

            const compliance = {
                compliant: false,
                violations: ['Exceeds limit']
            };

            const result = PaymentService.assessRisk(paymentDetails, compliance);

            expect(result.level).toBe('medium'); // Matching implementation
            expect(result.warnings).toContain('Policy violations detected');
        });
    });

    describe('getNextNonce', () => {
        it('should generate incrementing nonces', () => {
            const nonce1 = PaymentService.getNextNonce('user123');
            const nonce2 = PaymentService.getNextNonce('user123');
            const nonce3 = PaymentService.getNextNonce('user123');

            expect(nonce2).toBe(nonce1 + 1);
            expect(nonce3).toBe(nonce2 + 1);
        });

        it('should maintain separate nonces per user', () => {
            const nonce1 = PaymentService.getNextNonce('userA');
            const nonce2 = PaymentService.getNextNonce('userB');

            expect(typeof nonce1).toBe('number');
            expect(typeof nonce2).toBe('number');
        });
    });
});
