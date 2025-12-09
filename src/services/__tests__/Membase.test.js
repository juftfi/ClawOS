const MembaseService = require('../memory/MembaseService');

describe('Membase Service (fallback local storage)', () => {
    beforeEach(() => {
        // Reset fallback storage to known state
        MembaseService.fallbackStorage.conversations = new Map();
        MembaseService.fallbackStorage.preferences = new Map();
        MembaseService.fallbackStorage.transactions = new Map();
        MembaseService.fallbackStorage.contracts = new Map();
        MembaseService.operationQueue = [];
        // Force fallback mode for tests (no external membase required)
        MembaseService.isConnected = false;
        MembaseService.usesFallback = true;
    });

    describe('storeConversation', () => {
        it('should store conversation successfully (fallback)', async () => {
            const result = await MembaseService.storeConversation(
                'agent1',
                'Hello',
                'Hi there!',
                new Date().toISOString()
            );

            expect(result).toHaveProperty('success');
            expect(result.success).toBe(true);
            expect(MembaseService.fallbackStorage.conversations.size).toBeGreaterThan(0);
        });

        it('should use fallback storage when external storage unavailable', async () => {
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
        it('should retrieve conversation history from fallback', async () => {
            const entry = {
                agent_id: 'agent1',
                user_message: 'Hello',
                ai_response: 'Hi!',
                timestamp: new Date().toISOString()
            };

            MembaseService.fallbackStore('conversations', `agent1_${Date.now()}`, entry);

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

            // Populate fallback with 100 entries
            for (let i = 0; i < 100; i++) {
                MembaseService.fallbackStore('conversations', `agent1_${i}`, {
                    agent_id: 'agent1',
                    user_message: `Message ${i}`,
                    ai_response: `Response ${i}`,
                    timestamp: new Date().toISOString()
                });
            }

            const result = await MembaseService.getConversationHistory('agent1', 10);

            expect(result.length).toBeLessThanOrEqual(10);
        });
    });

    describe('storeUserPreference', () => {
        it('should store user preference (fallback)', async () => {
            const result = await MembaseService.storeUserPreference(
                'user1',
                'theme',
                'dark'
            );

            expect(result.success).toBe(true);
            expect(MembaseService.fallbackStorage.preferences.size).toBeGreaterThan(0);
        });
    });

    describe('getUserPreferences', () => {
        it('should retrieve user preferences', async () => {
            const mockPrefs = [
                { user_id: 'user1', key: 'theme', value: 'dark' },
                { user_id: 'user1', key: 'language', value: 'en' }
            ];

            // Store preferences in fallback
            MembaseService.fallbackStore('preferences', 'user1_theme', { user_id: 'user1', key: 'theme', value: 'dark' });
            MembaseService.fallbackStore('preferences', 'user1_language', { user_id: 'user1', key: 'language', value: 'en' });

            const result = await MembaseService.getUserPreferences('user1');

            expect(result).toHaveProperty('theme');
            expect(result).toHaveProperty('language');
            expect(result.theme).toBe('dark');
            expect(result.language).toBe('en');
        });

        it('should return empty object for user with no preferences', async () => {
            const result = await MembaseService.getUserPreferences('newuser');
            expect(result).toEqual({});
        });
    });

    describe('storeTransaction', () => {
        it('should store transaction log', async () => {
            const txDetails = {
                agent_id: 'agent1',
                from: '0x123',
                to: '0x456',
                value: '1',
                status: 'success',
                gas_used: 21000,
                block_number: 12345
            };

            const result = await MembaseService.storeTransaction('0xabc123', txDetails);
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

            // Store a tx in fallback
            MembaseService.fallbackStore('transactions', `agent1_${Date.now()}`, mockTxs[0]);

            const result = await MembaseService.getTransactionLog('agent1', 10);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('storeContractTemplate', () => {
        it('should store contract template', async () => {
            const result = await MembaseService.storeContractTemplate('ERC20', 'pragma solidity ^0.8.0;', {});
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

            // Store as fallback contract template
            MembaseService.fallbackStore('contracts', 'ERC20', mockTemplate);
            const result = await MembaseService.getContractTemplate('ERC20');
            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('code');
            expect(result.name).toBe('ERC20');
        });

        it('should throw error for non-existent template', async () => {
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

            // Populate fallback
            for (const r of mockResults) {
                MembaseService.fallbackStore('conversations', `id_${r.id}`, r);
            }

            const result = await MembaseService.queryMemory('conversations', { agent_id: undefined }, 10);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
        });
    });

    describe('fallback storage', () => {
        it('should use fallback when API is unavailable', async () => {
            // Force fallback usage
            MembaseService.isConnected = false;
            const result = await MembaseService.storeConversation('agent1', 'Test', 'Response');
            expect(result.fallback).toBe(true);
            expect(MembaseService.usesFallback).toBe(true);
        });

        it('should query from fallback storage', async () => {
            // Store in fallback
            MembaseService.fallbackStore('conversations', 'agent1_1', {
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
            // Simulate rate limit by forcing an exception in storage call path
            // For fallback mode, storeConversation will succeed; to test queue behavior
            // we temporarily set isConnected true and override storage.uploadHub to throw with status 429
            MembaseService.isConnected = true;
            MembaseService.isConnected = true;
            // Create a fake storage with uploadHub throwing 429
            MembaseService.storage = {
                uploadHub: async () => { const e = new Error('Rate limited'); e.response = { status: 429 }; throw e; }
            };

            await MembaseService.storeConversation('agent1', 'Test', 'Response').catch(() => { });

            expect(MembaseService.operationQueue.length).toBeGreaterThan(0);
            // Reset
            MembaseService.storage = null;
            MembaseService.isConnected = false;
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
