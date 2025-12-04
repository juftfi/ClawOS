const ConversationManager = require('../memory/ConversationManager');
const MembaseService = require('../memory/MembaseService');

// Mock MembaseService
jest.mock('../memory/MembaseService');

describe('Conversation Manager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset active conversations
        ConversationManager.activeConversations = new Map();
    });

    describe('initializeConversation', () => {
        it('should initialize a new conversation', async () => {
            const result = await ConversationManager.initializeConversation('agent1', 'user1');

            expect(result.success).toBe(true);
            expect(result.agent_id).toBe('agent1');
            expect(ConversationManager.activeConversations.has('agent1')).toBe(true);
        });
    });

    describe('addMessage', () => {
        it('should add a user message', async () => {
            await ConversationManager.initializeConversation('agent1', 'user1');

            const result = await ConversationManager.addMessage('agent1', 'Hello', 'user');

            expect(result.success).toBe(true);
            expect(result.role).toBe('user');
            expect(ConversationManager.activeConversations.get('agent1').last_user_message).toBe('Hello');
        });

        it('should store assistant message and conversation turn', async () => {
            await ConversationManager.initializeConversation('agent1', 'user1');
            await ConversationManager.addMessage('agent1', 'Hello', 'user');

            MembaseService.storeConversation.mockResolvedValue({ success: true });

            const result = await ConversationManager.addMessage('agent1', 'Hi there', 'assistant');

            expect(result.success).toBe(true);
            expect(MembaseService.storeConversation).toHaveBeenCalledWith(
                'agent1',
                'Hello',
                'Hi there',
                expect.any(String)
            );
        });
    });

    describe('getContext', () => {
        it('should retrieve context messages', async () => {
            const mockHistory = [
                { user_message: 'Q2', ai_response: 'A2', timestamp: '2023-01-02' },
                { user_message: 'Q1', ai_response: 'A1', timestamp: '2023-01-01' }
            ];

            MembaseService.getConversationHistory.mockResolvedValue(mockHistory);

            const context = await ConversationManager.getContext('agent1');

            expect(context).toHaveLength(4); // 2 turns * 2 messages
            expect(context[0].role).toBe('user');
            expect(context[0].content).toBe('Q1');
        });
    });

    describe('summarizeConversation', () => {
        it('should summarize conversation', async () => {
            const mockHistory = [
                { user_message: 'Q2', ai_response: 'A2', timestamp: '2023-01-02T10:00:00Z' },
                { user_message: 'Q1', ai_response: 'A1', timestamp: '2023-01-01T10:00:00Z' }
            ];

            MembaseService.getConversationHistory.mockResolvedValue(mockHistory);

            const summary = await ConversationManager.summarizeConversation('agent1');

            expect(summary.message_count).toBe(2);
            expect(summary.started_at).toBe('2023-01-01T10:00:00Z');
        });
    });

    describe('clearOldConversations', () => {
        it('should clear old conversations', async () => {
            const now = new Date();
            const oldDate = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString();
            const newDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();

            const mockHistory = [
                { timestamp: newDate },
                { timestamp: oldDate }
            ];

            MembaseService.getConversationHistory.mockResolvedValue(mockHistory);

            const result = await ConversationManager.clearOldConversations('agent1', 30);

            expect(result.removed_count).toBe(1);
            expect(result.kept_count).toBe(1);
        });
    });
});
