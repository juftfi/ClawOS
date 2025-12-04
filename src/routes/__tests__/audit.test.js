const request = require('supertest');
const express = require('express');

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid')
}));

const auditRouter = require('../audit');
const auditService = require('../../services/audit/AuditService');

// Mock AuditService
jest.mock('../../services/audit/AuditService');

const app = express();
app.use(express.json());
app.use('/api/audit', auditRouter);

describe('Audit Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/audit/log', () => {
        it('should retrieve audit logs', async () => {
            const mockLogs = [{ id: '1', action_type: 'LOGIN' }];
            auditService.getAuditTrail.mockResolvedValue(mockLogs);

            const res = await request(app)
                .get('/api/audit/log')
                .query({ user_id: 'user1' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.entries).toHaveLength(1);
            expect(auditService.getAuditTrail).toHaveBeenCalledWith(
                expect.objectContaining({ user_id: 'user1' })
            );
        });
    });

    describe('GET /api/audit/report', () => {
        it('should generate compliance report', async () => {
            const mockReport = {
                report_id: 'rep-1',
                summary: { total_actions: 10 }
            };
            auditService.generateComplianceReport.mockResolvedValue(mockReport);

            const res = await request(app)
                .get('/api/audit/report')
                .query({ start_date: '2023-01-01' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockReport);
            expect(auditService.generateComplianceReport).toHaveBeenCalled();
        });
    });

    describe('GET /api/audit/user/:userId', () => {
        it('should retrieve user audit trail', async () => {
            const mockLogs = [{ id: '1', user_id: 'user1' }];
            auditService.getUserAuditTrail.mockResolvedValue(mockLogs);

            const res = await request(app)
                .get('/api/audit/user/user1');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user_id).toBe('user1');
            expect(auditService.getUserAuditTrail).toHaveBeenCalledWith('user1', 100);
        });
    });

    describe('GET /api/audit/transaction/:txHash', () => {
        it('should retrieve transaction audit', async () => {
            const mockEntry = { id: '1', tx_hash: '0x123' };
            auditService.getTransactionAudit.mockResolvedValue(mockEntry);

            const res = await request(app)
                .get('/api/audit/transaction/0x123');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockEntry);
        });

        it('should return 404 if transaction not found', async () => {
            auditService.getTransactionAudit.mockResolvedValue(null);

            const res = await request(app)
                .get('/api/audit/transaction/0x123');

            expect(res.status).toBe(404);
        });
    });

    describe('POST /api/audit/log-action', () => {
        it('should log an action', async () => {
            const mockEntry = { id: '1', action_type: 'TEST' };
            auditService.logAction.mockResolvedValue(mockEntry);

            const res = await request(app)
                .post('/api/audit/log-action')
                .send({
                    actionType: 'TEST',
                    entityId: 'ent1',
                    userId: 'user1'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(auditService.logAction).toHaveBeenCalled();
        });

        it('should validate required fields', async () => {
            const res = await request(app)
                .post('/api/audit/log-action')
                .send({});

            expect(res.status).toBe(400);
        });
    });
});
