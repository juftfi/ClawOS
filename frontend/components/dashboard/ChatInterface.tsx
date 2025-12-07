'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { useAccount } from 'wagmi';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function ChatInterface() {
    const { address, isConnected } = useAccount();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load conversation history when wallet connects
    useEffect(() => {
        const loadHistory = async () => {
            if (!address || !isConnected) {
                setMessages([{
                    role: 'assistant',
                    content: "Hello! I'm your AgentOS AI assistant. Connect your wallet to access your conversation history and start chatting!",
                    timestamp: new Date()
                }]);
                setLoadingHistory(false);
                return;
            }

            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const agentId = `user-${address}`;

                const response = await axios.get(`${API_URL}/api/memory/conversation/${agentId}?limit=50`);

                if (response.data.success && response.data.data.messages.length > 0) {
                    const loadedMessages = response.data.data.messages.map((msg: any) => ({
                        role: msg.role,
                        content: msg.content,
                        timestamp: new Date(msg.timestamp)
                    }));
                    setMessages(loadedMessages);
                } else {
                    // No history, show welcome message
                    setMessages([{
                        role: 'assistant',
                        content: `Hello! I'm your AgentOS AI assistant. I can help you research Web3 topics, analyze tokens, or explain complex protocols using ChainGPT. What's on your mind?`,
                        timestamp: new Date()
                    }]);
                }
            } catch (error) {
                console.error('Failed to load conversation history:', error);
                setMessages([{
                    role: 'assistant',
                    content: "Hello! I'm your AgentOS AI assistant. I can help you research Web3 topics, analyze tokens, or explain complex protocols using ChainGPT. What's on your mind?",
                    timestamp: new Date()
                }]);
            } finally {
                setLoadingHistory(false);
            }
        };

        loadHistory();
    }, [address, isConnected]);

    const handleSend = async () => {
        if (!input.trim() || loading || !address) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

            // Call ChainGPT Research Endpoint
            const response = await axios.post(`${API_URL}/api/agent/research`, {
                query: userMessage.content
            });

            const aiContent = response.data.result || response.data.response || "I processed your request but received no specific text response.";

            const aiMessage: Message = {
                role: 'assistant',
                content: aiContent,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);

            // Store in memory with wallet address as agentId
            const agentId = `user-${address}`;
            axios.post(`${API_URL}/api/memory/conversation`, {
                agentId,
                userMessage: userMessage.content,
                aiResponse: aiContent
            }).catch(err => console.error("Failed to save memory:", err));

        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "**Error:** I encountered an issue connecting to the AgentOS brain. Please ensure the backend is running.",
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">AgentOS Brain</h3>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs text-slate-400">Online • ChainGPT-4</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setMessages([])}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    title="Clear Chat"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        {/* Avatar */}
                        <div className={`
              w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-md
              ${msg.role === 'user' ? 'bg-slate-700' : 'bg-purple-600/20 text-purple-400'}
            `}>
                            {msg.role === 'user' ? <User className="w-5 h-5 text-slate-300" /> : <Sparkles className="w-5 h-5" />}
                        </div>

                        {/* Bubble */}
                        <div className={`
              max-w-[80%] rounded-2xl p-4 shadow-sm
              ${msg.role === 'user'
                                ? 'bg-purple-600 text-white rounded-tr-none'
                                : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                            }
            `}>
                            {msg.role === 'user' ? (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            ) : (
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            )}
                            <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-purple-200' : 'text-slate-500'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-400 flex-shrink-0 flex items-center justify-center">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none p-4 flex items-center gap-3">
                            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                            <span className="text-sm text-slate-400">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-800 bg-slate-900">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about Web3, DeFi, or smart contracts..."
                        className="flex-1 bg-slate-800 border-slate-700 text-white placeholder-slate-500 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-inner"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="p-3 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-center text-xs text-slate-600 mt-2">
                    Powered by ChainGPT. Responses are AI-generated for research purposes.
                </p>
            </div>
        </div>
    );
}
