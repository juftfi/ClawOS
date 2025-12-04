const PolicyService = require('../x402/PolicyService');
const MembaseService = require('../memory/MembaseService');
const BlockchainService = require('../blockchain/BlockchainService');

// Mock dependencies
jest.mock('../memory/MembaseService');
jest.mock('../blockchain/BlockchainService');

describe('Policy Service', () => {
    let mockWeb3;

    beforeEach(() => {
        jest.clearAllMocks();

        mockWeb3 = {
            utils: {
                toWei: jest.fn((val) => (parseFloat(val) * 1e18).toString()),
                fromWei: jest.fn((val) => (parseFloat(val) / 1e18).toString())
            }
        };

        BlockchainService.getWeb3.mockReturnValue(mockWeb3);
        PolicyService.dailyTracking = new Map();
        PolicyService.policies = new Map();
    });

    describe('getDefaultPolicy', () => {
        it('should return default policy', () => {
            const policy = PolicyService.getDefaultPolicy();

            expect(policy).toHaveProperty('max_daily_spend');
            expect(policy).toHaveProperty('max_single_tx');
            expect(policy).toHaveProperty('daily_tx_limit');
            expect(policy.daily_tx_limit).toBe(100);
        });
    });

    describe('storePolicy', () => {
        it('should store policy successfully', async () => {
            MembaseService.storeUserPreference.mockResolvedValue({ success: true });

            const policy = { max_daily_spend: '5000000000000000000' };
            const result = await PolicyService.storePolicy('user1', policy);

            expect(result.success).toBe(true);
            expect(result.policy).toEqual(policy);
            expect(MembaseService.storeUserPreference).toHaveBeenCalledWith('user1', 'payment_policy', policy);
        });
    });

    describe('getPolicy', () => {
        it('should return cached policy if available', async () => {
            const mockPolicy = { max_daily_spend: '1000000000000000000' };
            PolicyService.policies.set('user1', mockPolicy);

            const policy = await PolicyService.getPolicy('user1');

            expect(policy).toBe(mockPolicy);
            expect(MembaseService.getUserPreferences).not.toHaveBeenCalled();
        });

        it('should fetch and cache policy from storage', async () => {
            const mockPolicy = { max_daily_spend: '2000000000000000000' };
            MembaseService.getUserPreferences.mockResolvedValue({ payment_policy: mockPolicy });

            const policy = await PolicyService.getPolicy('user1');

            expect(policy).toEqual(mockPolicy);
            expect(PolicyService.policies.has('user1')).toBe(true);
        });

        it('should return default policy if none exists', async () => {
            MembaseService.getUserPreferences.mockResolvedValue({});

            const policy = await PolicyService.getPolicy('user1');

            expect(policy).toHaveProperty('max_daily_spend');
            expect(policy).toHaveProperty('daily_tx_limit');
        });
    });

    describe('getDailyTransactionCount', () => {
        it('should return daily transaction count', async () => {
            const today = PolicyService.getTodayKey();
            const trackingKey = `user1:${today}`;
            PolicyService.dailyTracking.set(trackingKey, { tx_count: 5 });

            const count = await PolicyService.getDailyTransactionCount('user1');

            expect(count).toBe(5);
        });

        it('should return 0 for users with no transactions', async () => {
            const count = await PolicyService.getDailyTransactionCount('newuser');
            expect(count).toBe(0);
        });
    });

    describe('getDailySpending', () => {
        it('should return daily spending', async () => {
            const today = PolicyService.getTodayKey();
            const trackingKey = `user1:${today}`;
            PolicyService.dailyTracking.set(trackingKey, { spent_wei: '500000000000000000' });

            const spent = await PolicyService.getDailySpending('user1');

            expect(spent).toBe('500000000000000000');
        });

        it('should return 0 for users with no spending', async () => {
            const spent = await PolicyService.getDailySpending('newuser');
            expect(spent).toBe('0');
        });
    });

    describe('getTodayKey', () => {
        it('should return today date key', () => {
            const key = PolicyService.getTodayKey();
            const today = new Date();
            const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            expect(key).toBe(expected);
        });
    });

    describe('setSpendingLimit', () => {
        it('should set spending limit', async () => {
            MembaseService.getUserPreferences.mockResolvedValue({});
            MembaseService.storeUserPreference.mockResolvedValue({ success: true });

            const result = await PolicyService.setSpendingLimit('user1', '5.0');

            expect(result.success).toBe(true);
            expect(result.max_daily_spend_bnb).toBe('5.0');
            expect(mockWeb3.utils.toWei).toHaveBeenCalledWith('5.0', 'ether');
        });
    });

    describe('clearOldTracking', () => {
        it('should clear old tracking data', () => {
            const today = PolicyService.getTodayKey();
            PolicyService.dailyTracking.set(`user1:${today}`, { tx_count: 5 });
            PolicyService.dailyTracking.set('user1:2020-01-01', { tx_count: 10 });

            PolicyService.clearOldTracking();

            expect(PolicyService.dailyTracking.has(`user1:${today}`)).toBe(true);
            expect(PolicyService.dailyTracking.has('user1:2020-01-01')).toBe(false);
        });
    });

    describe('recordTransaction', () => {
        it('should record transaction in daily tracking', async () => {
            const payment = {
                amount: '0.5',
                user: 'user1'
            };

            await PolicyService.recordPayment('user1', payment);

            const today = PolicyService.getTodayKey();
            const trackingKey = `user1:${today}`;
            const tracking = PolicyService.dailyTracking.get(trackingKey);

            expect(tracking).toBeDefined();
            expect(tracking.tx_count).toBeGreaterThan(0);
        });
    });

    describe('checkPolicyCompliance', () => {
        it('should approve compliant payment', async () => {
            const payment = {
                amount: '0.05',
                recipient: '0xrecipient',
                action: 'transfer'
            };

            const result = await PolicyService.checkPolicyCompliance(payment, 'user1');

            expect(result.compliant).toBe(true);
            expect(result.violations).toHaveLength(0);
        });

        it('should reject payment exceeding single tx limit', async () => {
            const payment = {
                amount: '0.2', // Limit is 0.1
                recipient: '0xrecipient',
                action: 'transfer'
            };

            const result = await PolicyService.checkPolicyCompliance(payment, 'user1');

            expect(result.compliant).toBe(false);
            expect(result.violations).toContain(expect.stringContaining('exceeds single transaction limit'));
        });

        it('should reject payment exceeding daily limit', async () => {
            // Mock daily spending to be near limit
            const today = PolicyService.getTodayKey();
            PolicyService.dailyTracking.set(`user1:${today}`, { spent_wei: '900000000000000000' }); // 0.9 BNB

            const payment = {
                amount: '0.2', // Total 1.1 > 1.0 limit
                recipient: '0xrecipient',
                action: 'transfer'
            };

            const result = await PolicyService.checkPolicyCompliance(payment, 'user1');

            expect(result.compliant).toBe(false);
            expect(result.violations).toContain(expect.stringContaining('exceeds daily spending limit'));
        });

        it('should warn when approaching daily limit', async () => {
            // Mock daily spending
            const today = PolicyService.getTodayKey();
            PolicyService.dailyTracking.set(`user1:${today}`, { spent_wei: '700000000000000000' }); // 0.7 BNB

            const payment = {
                amount: '0.15', // Total 0.85 > 0.8 (80%)
                recipient: '0xrecipient',
                action: 'transfer'
            };

            const result = await PolicyService.checkPolicyCompliance(payment, 'user1');

            expect(result.compliant).toBe(true);
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0]).toContain('Approaching daily spending limit');
        });

        it('should reject payment exceeding daily tx count', async () => {
            const today = PolicyService.getTodayKey();
            PolicyService.dailyTracking.set(`user1:${today}`, { tx_count: 100 }); // Limit is 100

            const payment = {
                amount: '0.01',
                recipient: '0xrecipient',
                action: 'transfer'
            };

            const result = await PolicyService.checkPolicyCompliance(payment, 'user1');

            expect(result.compliant).toBe(false);
            expect(result.violations).toContain(expect.stringContaining('Daily transaction limit'));
        });
    });

    describe('Address Lists', () => {
        it('should set allowed addresses', async () => {
            BlockchainService.validateAddress = jest.fn().mockReturnValue(true);

            const result = await PolicyService.setAllowedAddresses('user1', ['0xallowed']);

            expect(result.success).toBe(true);
            expect(result.allowed_addresses).toContain('0xallowed');

            const policy = await PolicyService.getPolicy('user1');
            expect(policy.allowed_addresses).toContain('0xallowed');
        });

        it('should enforce allowed addresses', async () => {
            BlockchainService.validateAddress = jest.fn().mockReturnValue(true);
            await PolicyService.setAllowedAddresses('user1', ['0xallowed']);

            const payment = {
                amount: '0.01',
                recipient: '0xother',
                action: 'transfer'
            };

            const result = await PolicyService.checkPolicyCompliance(payment, 'user1');

            expect(result.compliant).toBe(false);
            expect(result.violations).toContain('Recipient not in allowlist');
        });

        it('should set denied addresses', async () => {
            BlockchainService.validateAddress = jest.fn().mockReturnValue(true);
            const result = await PolicyService.setDeniedAddresses('user1', ['0xdenied']);

            expect(result.success).toBe(true);
            expect(result.denied_addresses).toContain('0xdenied');
        });

        it('should enforce denied addresses', async () => {
            BlockchainService.validateAddress = jest.fn().mockReturnValue(true);
            await PolicyService.setDeniedAddresses('user1', ['0xdenied']);

            const payment = {
                amount: '0.01',
                recipient: '0xdenied',
                action: 'transfer'
            };

            const result = await PolicyService.checkPolicyCompliance(payment, 'user1');

            expect(result.compliant).toBe(false);
            expect(result.violations).toContain('Recipient is in denylist');
        });
    });

    describe('getPolicySummary', () => {
        it('should return policy summary', async () => {
            const summary = await PolicyService.getPolicySummary('user1');

            expect(summary).toHaveProperty('limits');
            expect(summary).toHaveProperty('today');
            expect(summary.limits.max_daily_spend_bnb).toBe('1');
        });
    });
});
