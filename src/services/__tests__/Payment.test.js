const PaymentService = require('../x402/PaymentService');
const PolicyService = require('../x402/PolicyService');
const SignatureService = require('../x402/SignatureService');
const BlockchainService = require('../blockchain/BlockchainService');

jest.mock('../x402/PolicyService');
jest.mock('../x402/SignatureService');
jest.mock('../blockchain/BlockchainService');

describe('Payment Service', () => {
    const mockWeb3 = {
        utils: {
            toWei: jest.fn((val) => (parseFloat(val) * 1e18).toString()),
            fromWei: jest.fn((val) => (parseFloat(val) / 1e18).toString())
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        PaymentService.activeSessions = new Map();
        PaymentService.paymentNonces = new Map();
        BlockchainService.getWeb3.mockReturnValue(mockWeb3);
        BlockchainService.validateAddress.mockReturnValue(true);
    });

    describe('initializePaymentSession', () => {
        it('should initialize a payment session', async () => {
            const result = await PaymentService.initializePaymentSession('user1', 'transfer');

            expect(result.success).toBe(true);
            expect(result.session_id).toBeDefined();
            expect(result.user_id).toBe('user1');
            expect(result.agent_action).toBe('transfer');
            expect(result.nonce).toBeGreaterThan(0);
        });

        it('should set session expiration time', async () => {
            const result = await PaymentService.initializePaymentSession('user1', 'swap');

            expect(result.expires_at).toBeDefined();
            const expiresAt = new Date(result.expires_at);
            expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
        });
    });

    describe('preparePayment', () => {
        it('should prepare payment with valid data', async () => {
            PolicyService.checkPolicyCompliance.mockResolvedValue({
                compliant: true,
                violations: []
            });
            BlockchainService.estimateGas.mockResolvedValue({
                gas_limit: '21000',
                gas_price_gwei: '5'
            });

            const result = await PaymentService.preparePayment('1.0', '0xrecipient', {
                user_id: 'user1',
                action: 'transfer'
            });

            expect(result.success).toBe(true);
            expect(result.policy_compliant).toBe(true);
            expect(result.payment).toBeDefined();
        });

        it('should reject invalid recipient address', async () => {
            BlockchainService.validateAddress.mockReturnValue(false);

            await expect(PaymentService.preparePayment('1.0', 'invalid', {
                user_id: 'user1'
            })).rejects.toThrow('Invalid recipient address');
        });

        it('should reject policy violation', async () => {
            PolicyService.checkPolicyCompliance.mockResolvedValue({
                compliant: false,
                violations: ['Exceeded daily limit']
            });

            await expect(PaymentService.preparePayment('1000.0', '0xrecipient', {
                user_id: 'user1'
            })).rejects.toThrow('Policy violation');
        });
    });

    describe('createPaymentPolicy', () => {
        it('should create payment policy with defaults', async () => {
            PolicyService.storePolicy.mockResolvedValue({ success: true });

            const result = await PaymentService.createPaymentPolicy('user1', {});

            expect(result.success).toBe(true);
            expect(result.policy).toBeDefined();
            expect(result.policy.daily_tx_limit).toBe(100);
        });

        it('should create policy with custom rules', async () => {
            PolicyService.storePolicy.mockResolvedValue({ success: true });

            const result = await PaymentService.createPaymentPolicy('user1', {
                max_daily_spend: '5000000000000000000',
                daily_tx_limit: 50
            });

            expect(result.policy.max_daily_spend).toBe('5000000000000000000');
            expect(result.policy.daily_tx_limit).toBe(50);
        });
    });

    describe('getNextNonce', () => {
        it('should generate and increment nonce', () => {
            const nonce1 = PaymentService.getNextNonce('user1');
            const nonce2 = PaymentService.getNextNonce('user1');

            expect(nonce2).toBe(nonce1 + 1);
        });

        it('should start with random nonce for new users', () => {
            const nonce = PaymentService.getNextNonce('newuser');
            expect(nonce).toBeGreaterThan(0);
        });

        it('should maintain separate nonces per user', () => {
            const nonce1 = PaymentService.getNextNonce('user1');
            const nonce2 = PaymentService.getNextNonce('user2');

            expect(nonce1).not.toBe(nonce2);
        });
    });

    describe('generateSessionId', () => {
        it('should generate unique session IDs', () => {
            const id1 = PaymentService.generateSessionId();
            const id2 = PaymentService.generateSessionId();

            expect(id1).toBeDefined();
            expect(id2).toBeDefined();
            expect(id1).not.toBe(id2);
        });

        it('should generate IDs with correct format', () => {
            const id = PaymentService.generateSessionId();

            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(10);
        });
    });

    describe('getSession', () => {
        it('should retrieve active session', () => {
            const session = {
                session_id: 'test123',
                user_id: 'user1',
                status: 'active'
            };
            PaymentService.activeSessions.set('test123', session);

            const result = PaymentService.getSession('test123');

            expect(result).toEqual(session);
        });

        it('should return null for non-existent session', () => {
            const result = PaymentService.getSession('nonexistent');
            expect(result).toBeNull();
        });
    });
});
