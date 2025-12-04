const AuditService = require('../audit/AuditService');
const MembaseService = require('../memory/MembaseService');

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid')
}));

// Mock MembaseService
jest.mock('../memory/MembaseService');

describe('Audit Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset cache
        AuditService.auditLogs = new Map();
    });

    describe('logAction', () => {
        it('should log an action successfully', async () => {
            const mockEntry = {
                id: 'test-id',
                action_type: 'USER_LOGIN',
                timestamp: new Date().toISOString()
            };

            MembaseService.store.mockResolvedValue({ success: true, id: 'test-id' });

            const result = await AuditService.logAction(
                'USER_LOGIN',
                'user-123',
                'user-123',
                { ip: '127.0.0.1' }
            );

            expect(result).toHaveProperty('id');
            expect(result.action_type).toBe('USER_LOGIN');
            expect(result.entity_id).toBe('user-123');
            expect(MembaseService.store).toHaveBeenCalledWith('audit_logs', expect.any(Object));
        });

        it('should handle logging errors gracefully', async () => {
            MembaseService.store.mockRejectedValue(new Error('Storage failed'));

            await expect(AuditService.logAction('USER_LOGIN', 'user-123', 'user-123'))
                .rejects.toThrow('Storage failed');
        });
    });

    describe('getAuditTrail', () => {
        it('should retrieve audit logs with filters', async () => {
            const mockLogs = [
                { id: '1', action_type: 'LOGIN', timestamp: '2023-01-01T10:00:00Z' },
                { id: '2', action_type: 'LOGOUT', timestamp: '2023-01-01T11:00:00Z' }
            ];

            MembaseService.queryMemory.mockResolvedValue(mockLogs);

            const filters = { user_id: 'user-123' };
            const result = await AuditService.getAuditTrail(filters);

            expect(result).toHaveLength(2);
            // Service requests limit * 2 to handle filtering
            expect(MembaseService.queryMemory).toHaveBeenCalledWith('audit_logs', filters, 200);
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
