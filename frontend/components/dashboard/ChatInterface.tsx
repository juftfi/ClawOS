'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const searchParams = useSearchParams();
    const agentIdParam = searchParams.get('agentId');

    useEffect(() => {
        if (!hasMounted) return;

        const loadHistory = async () => {
            if (!address || !isConnected) {
                setMessages([
                    {
                        role: 'assistant',
                        content:
                            "Hello! I'm your AgentOS AI assistant. Connect your wallet to access your conversation history and start chatting!",
                        timestamp: new Date(),
                    },
                ]);
<<<<<<< HEAD
=======
                setLoadingHistory(false);
>>>>>>> feature/landing-dashboard
                return;
            }

            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const agentId = agentIdParam || `user-${address}`;

                const response = await axios.get(`${API_URL}/api/memory/conversation/${agentId}?limit=50`);

                if (response.data.success && response.data.data.messages.length > 0) {
                    const loadedMessages = response.data.data.messages.map((msg: any) => ({
                        role: msg.role,
                        content: msg.content,
                        timestamp: new Date(msg.timestamp),
                    }));
                    setMessages(loadedMessages);
                } else {
                    setMessages([
                        {
                            role: 'assistant',
                            content:
                                "Hello! I'm your AgentOS AI assistant. I can help you research Web3 topics, analyze tokens, or explain complex protocols using ChainGPT. What's on your mind?",
                            timestamp: new Date(),
                        },
                    ]);
                }
            } catch (error) {
                console.error('Failed to load conversation history:', error);
                setMessages([
                    {
                        role: 'assistant',
                        content:
                            "Hello! I'm your AgentOS AI assistant. I can help you research Web3 topics, analyze tokens, or explain complex protocols using ChainGPT. What's on your mind?",
                        timestamp: new Date(),
                    },
                ]);
<<<<<<< HEAD
=======
            } finally {
                setLoadingHistory(false);
>>>>>>> feature/landing-dashboard
            }
        };

        loadHistory();
    }, [address, isConnected, hasMounted, agentIdParam]);

    const handleSend = async () => {
        if (!input.trim() || loading || !address) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        trackEvent('agent_chat_send', { length: userMessage.content.length });

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

            const response = await axios.post(`${API_URL}/api/agent/research`, {
                query: userMessage.content,
            });

            const aiContent =
                response.data.result ||
                response.data.response ||
                'I processed your request but received no specific text response.';

            const aiMessage: Message = {
                role: 'assistant',
                content: aiContent,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMessage]);

            const agentId = agentIdParam || `user-${address}`;
            axios
                .post(`${API_URL}/api/memory/conversation`, {
                    agentId,
                    userMessage: userMessage.content,
                    aiResponse: aiContent,
                })
                .catch(err => console.error('Failed to save memory:', err));
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content:
                        '**Error:** I encountered an issue connecting to the AgentOS brain. Please ensure the backend is running.',
                    timestamp: new Date(),
                },
            ]);
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
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-black/60 border border-white/10 rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="p-4 border-b border-white/10 bg-black/60 backdrop-blur flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">AgentOS Brain</h3>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-xs text-slate-400">Online - ChainGPT-4</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setMessages([])}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                    title="Clear Chat"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div
                            className={`
              w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-md
              ${msg.role === 'user' ? 'bg-white text-black' : 'bg-white/10 text-white'}
            `}
                        >
                            {msg.role === 'user' ? (
                                <User className="w-5 h-5 text-black" />
                            ) : (
                                <Sparkles className="w-5 h-5" />
                            )}
                        </div>

                        <div
                            className={`
              max-w-[80%] rounded-2xl p-4 shadow-sm
              ${msg.role === 'user'
                                    ? 'bg-white text-black rounded-tr-none'
                                    : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
                                }
            `}
                        >
                            {msg.role === 'user' ? (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            ) : (
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            )}
                            <div
                                className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-black/60' : 'text-slate-500'
                                    }`}
                            >
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/10 text-white flex-shrink-0 flex items-center justify-center">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4 flex items-center gap-3">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                            <span className="text-sm text-slate-400">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/10 bg-black/70">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about Web3, DeFi, or smart contracts..."
                        className="flex-1 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/60 transition-all"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="p-3 bg-white text-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/40 hover:bg-white/90"
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
