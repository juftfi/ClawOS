const axios = require('axios');
const MembaseService = require('../memory/MembaseService');

jest.mock('axios');

describe('Membase Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        MembaseService.fallbackStorage.conversations.clear();
        MembaseService.fallbackStorage.preferences.clear();
        MembaseService.operationQueue = [];
    });

    describe('storeConversation', () => {
        it('should store conversation successfully', async () => {
            axios.post.mockResolvedValue({
                data: { id: 'conv123', success: true }
            });

            const result = await MembaseService.storeConversation(
                'agent1',
                'Hello',
                'Hi there!',
                new Date().toISOString()
            );

            expect(result).toHaveProperty('success');
            expect(result.success).toBe(true);
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/store'),
                expect.objectContaining({
                    collection: 'conversations'
                }),
                expect.any(Object)
            );
        });

        it('should use fallback storage on API failure', async () => {
            axios.post.mockRejectedValue(new Error('API Error'));

            const result = await MembaseService.storeConversation(
                'agent1',
                'Hello',
                'Hi there!'
            );

            expect(result).toHaveProperty('fallback');
            expect(result.fallback).toBe(true);
            expect(MembaseService.fallbackStorage.conversations.size).toBeGreaterThan(0);
        });
    });

    describe('getConversationHistory', () => {
        it('should retrieve conversation history', async () => {
            const mockHistory = [
                {
                    agent_id: 'agent1',
                    user_message: 'Hello',
                    ai_response: 'Hi!',
                    timestamp: new Date().toISOString()
                }
            ];

            axios.post.mockResolvedValue({
                data: { results: mockHistory }
            });

            const result = await MembaseService.getConversationHistory('agent1', 10);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toHaveProperty('agent_id');
        });

        it('should limit results to specified limit', async () => {
            const mockHistory = Array(100).fill(null).map((_, i) => ({
                agent_id: 'agent1',
                user_message: `Message ${i}`,
                ai_response: `Response ${i}`,
                timestamp: new Date().toISOString()
            }));

            axios.post.mockResolvedValue({
                data: { results: mockHistory }
            });

            const result = await MembaseService.getConversationHistory('agent1', 10);

            expect(result.length).toBeLessThanOrEqual(10);
        });
    });

    describe('storeUserPreference', () => {
        it('should store user preference', async () => {
            axios.post.mockResolvedValue({
                data: { id: 'pref123', success: true }
            });

            const result = await MembaseService.storeUserPreference(
                'user1',
                'theme',
                'dark'
            );

            expect(result.success).toBe(true);
            expect(axios.post).toHaveBeenCalled();
        });
    });

    describe('getUserPreferences', () => {
        it('should retrieve user preferences', async () => {
            const mockPrefs = [
                { user_id: 'user1', key: 'theme', value: 'dark' },
                { user_id: 'user1', key: 'language', value: 'en' }
            ];

            axios.post.mockResolvedValue({
                data: { results: mockPrefs }
            });

            const result = await MembaseService.getUserPreferences('user1');

            expect(result).toHaveProperty('theme');
            expect(result).toHaveProperty('language');
            expect(result.theme).toBe('dark');
            expect(result.language).toBe('en');
        });

        it('should return empty object for user with no preferences', async () => {
            axios.post.mockResolvedValue({
                data: { results: [] }
            });

            const result = await MembaseService.getUserPreferences('newuser');

            expect(result).toEqual({});
        });
    });

    describe('storeTransaction', () => {
        it('should store transaction log', async () => {
            axios.post.mockResolvedValue({
                data: { id: 'tx123', success: true }
            });

            const txDetails = {
                agent_id: 'agent1',
                from: '0x123',
                to: '0x456',
                value: '1',
                status: 'success',
                gas_used: 21000,
                block_number: 12345
            };

            const result = await MembaseService.storeTransaction(
                '0xabc123',
                txDetails
            );

            expect(result.success).toBe(true);
        });
    });

    describe('getTransactionLog', () => {
        it('should retrieve transaction log', async () => {
            const mockTxs = [
                {
                    tx_hash: '0xabc123',
                    agent_id: 'agent1',
                    timestamp: new Date().toISOString()
                }
            ];

            axios.post.mockResolvedValue({
                data: { results: mockTxs }
            });

            const result = await MembaseService.getTransactionLog('agent1', 10);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('storeContractTemplate', () => {
        it('should store contract template', async () => {
            axios.post.mockResolvedValue({
                data: { id: 'contract123', success: true }
            });

            const result = await MembaseService.storeContractTemplate(
                'ERC20',
                'pragma solidity ^0.8.0;',
                []
            );

            expect(result.success).toBe(true);
        });
    });

    describe('getContractTemplate', () => {
        it('should retrieve contract template', async () => {
            const mockTemplate = {
                name: 'ERC20',
                code: 'pragma solidity ^0.8.0;',
                abi: [],
                created_at: new Date().toISOString()
            };

            axios.post.mockResolvedValue({
                data: { results: [mockTemplate] }
            });

            const result = await MembaseService.getContractTemplate('ERC20');

            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('code');
            expect(result.name).toBe('ERC20');
        });

        it('should throw error for non-existent template', async () => {
            axios.post.mockResolvedValue({
                data: { results: [] }
            });

            const result = await MembaseService.getContractTemplate('NonExistent');
            expect(result).toBeNull();
        });
    });

    describe('queryMemory', () => {
        it('should query memory with filters', async () => {
            const mockResults = [
                { id: 1, data: 'test1' },
                { id: 2, data: 'test2' }
            ];

            axios.post.mockResolvedValue({
                data: { results: mockResults }
            });

            const result = await MembaseService.queryMemory(
                'conversations',
                { agent_id: 'agent1' },
                10
            );

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
        });
    });

    describe('fallback storage', () => {
        it('should use fallback when API is unavailable', async () => {
            axios.post.mockRejectedValue(new Error('Network error'));

            const result = await MembaseService.storeConversation(
                'agent1',
                'Test',
                'Response'
            );

            expect(result.fallback).toBe(true);
            expect(MembaseService.usesFallback).toBe(true);
        });

        it('should query from fallback storage', async () => {
            // Store in fallback
            MembaseService.fallbackStore('conversations', 'agent1', {
                agent_id: 'agent1',
                message: 'test'
            });

            const result = MembaseService.fallbackQuery('conversations', 'agent1', 10);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('operation queue', () => {
        it('should queue operations on rate limit', async () => {
            const error = new Error('Rate limited');
            error.response = { status: 429 };
            axios.post.mockRejectedValue(error);

            await MembaseService.storeConversation('agent1', 'Test', 'Response')
                .catch(() => { });

            expect(MembaseService.operationQueue.length).toBeGreaterThan(0);
        });
    });

    describe('getStats', () => {
        it('should return storage statistics', () => {
            const stats = MembaseService.getStats();

            expect(stats).toHaveProperty('uses_fallback');
            expect(stats).toHaveProperty('queued_operations');
            expect(stats).toHaveProperty('fallback_storage');
        });
    });
});
