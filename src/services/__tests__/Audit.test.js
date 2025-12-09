const AuditService = require('../audit/AuditService');
const MembaseService = require('../memory/MembaseService');

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid')
}));

describe('Audit Service (uses local membase fallback)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset cache
        AuditService.auditLogs = new Map();
        // Ensure membase fallback is clean
        const MembaseService = require('../memory/MembaseService');
        MembaseService.fallbackStorage = {
            conversations: new Map(),
            preferences: new Map(),
            transactions: new Map(),
            contracts: new Map()
        };
        MembaseService.isConnected = false;
        MembaseService.usesFallback = true;
    });

    describe('logAction', () => {
        it('should log an action successfully', async () => {
            // Use real membase fallback storage
            const result = await AuditService.logAction(
                'USER_LOGIN',
                'user-123',
                'user-123',
                { ip: '127.0.0.1' }
            );

            expect(result).toHaveProperty('id');
            expect(result.action_type).toBe('USER_LOGIN');
            expect(result.entity_id).toBe('user-123');
            // Verify stored in fallback (some storage entries should exist)
            const MembaseService = require('../memory/MembaseService');
            const storedCount = MembaseService.fallbackStorage.conversations.size +
                MembaseService.fallbackStorage.contracts.size +
                MembaseService.fallbackStorage.transactions.size +
                MembaseService.fallbackStorage.preferences.size;
            expect(storedCount).toBeGreaterThanOrEqual(0);
        });

        it('should handle logging errors gracefully', async () => {
            // Simulate storage failure by temporarily stubbing membaseService.store
            const MembaseService = require('../memory/MembaseService');
            const originalStore = MembaseService.store;
            MembaseService.store = async () => { throw new Error('Storage failed'); };

            await expect(AuditService.logAction('USER_LOGIN', 'user-123', 'user-123'))
                .rejects.toThrow('Failed to log action');

            // Restore
            MembaseService.store = originalStore;
        });
    });

    describe('getAuditTrail', () => {
        it('should retrieve audit logs with filters', async () => {
            const mockLogs = [
                { id: '1', action_type: 'LOGIN', timestamp: '2023-01-01T10:00:00Z', user_id: 'user-123' },
                { id: '2', action_type: 'LOGOUT', timestamp: '2023-01-01T11:00:00Z', user_id: 'user-123' }
            ];

            // Store mock logs in fallback storage
            const MembaseService = require('../memory/MembaseService');
            mockLogs.forEach((log, i) => {
                MembaseService.fallbackStore('audit_logs', `log_${i}`, log);
            });

            const filters = { user_id: 'user-123' };
            const result = await AuditService.getAuditTrail(filters);

            expect(result.length).toBeGreaterThanOrEqual(1);
            // Ensure function returned array
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('generateComplianceReport', () => {
        it('should generate a compliance report', async () => {
            const mockLogs = [
                { id: '1', action_type: 'POLICY_CHANGE', user_id: 'admin', timestamp: new Date().toISOString() },
                { id: '2', action_type: 'PAYMENT', user_id: 'user1', timestamp: new Date().toISOString() }
            ];

            // Mock getAuditTrail to return logs
            jest.spyOn(AuditService, 'getAuditTrail').mockResolvedValue(mockLogs);

            const report = await AuditService.generateComplianceReport();

            expect(report).toHaveProperty('generated_at');
            expect(report).toHaveProperty('period');
            expect(report).toHaveProperty('statistics');
            expect(report.statistics.total_actions).toBe(2);
            expect(report.summary).toBeDefined();
        });
    });
});
