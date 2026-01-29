# AgentOS Project Summary for Claude Code CLI

**Last Updated**: January 29, 2026

## Project Overview
AgentOS is an AI-native Web3 operating system that enables autonomous agents to research, transact, and remember. It integrates ChainGPT (AI), Quack Q402 (Payments on BNB Testnet), and Unibase AIP (Verifiable Memory).

## Tech Stack
- **Backend**: Express.js (Node.js), runs on port 3000
- **Frontend**: Next.js 14 (App Router), runs on port 3001
- **Blockchain**: BNB Testnet (Chain ID: 97)
- **AI**: ChainGPT Hub V2 API
- **Memory**: Unibase Membase (testnet.hub.membase.io)
- **Payments**: Quack Q402 (EIP-7702 delegated payments)

## Repo Structure
```
AgentOS-web3/
├── src/                  # Backend
│   ├── index.js          # Express entry, port 3000
│   ├── routes/           # API routes (agent.js, awe.js, etc.)
│   └── services/         # Core services
│       ├── agent/        # AgentOrchestrator, ServiceRegistry, NegotiationEngine
│       ├── chainGPT/     # LLMService, AuditorService, GeneratorService
│       ├── quack/        # Q402PaymentService (BNB Testnet)
│       └── memory/       # MembaseService (Unibase AIP)
├── frontend/             # Next.js 14 App Router
│   ├── app/              # Pages (dashboard, auth, etc.)
│   ├── components/       # ChatInterface, PaymentFlow, etc.
│   └── lib/              # Utilities
├── tests/                # Test scripts
├── .env                  # Environment variables (NEVER COMMIT)
└── .env.example          # Template for env vars
```

## Current State (Jan 29, 2026)
- **Backend**: 100% Live, verified on BNB Testnet (ChainGPT, Q402, Unibase)
- **Frontend**: Basic dashboard exists, needs premium overhaul
- **Goal**: Hashed Vibe Labs submission by Feb 19, 2026

## MVP Tasks (Build Now)
1. Premium Landing Page (Dark theme, Stripe/Chainlink level)
2. User Auth (Supabase/NextAuth: Wallet SIWE, Email, Google, X)
3. User Profiles (Link wallets, socials)
4. Analytics (Plausible/PostHog)
5. Dashboard MVP (Wire to live backend)
6. Security (Rate limiting, CSRF, DDoS protection)

## Environment Variables (.env)
```
CHAINGPT_API_KEY=*****
CHAINGPT_API_URL=https://api.chaingpt.org/chat/v2
MEMBASE_HUB_URL=https://testnet.hub.membase.io
BNB_TESTNET_RPC=https://bsc-testnet-rpc.publicnode.com
PRIVATE_KEY=***** (NEVER SHARE)
```

## Key API Endpoints
- `POST /api/agent/research` - AI research
- `POST /api/agent/generate-contract` - Smart contract generation
- `POST /api/agent/execute-action` - On-chain actions
- `POST /api/agent/discover-and-negotiate` - B2B agent discovery
- `GET /api/agent/stats` - Platform statistics

## Running Locally
```bash
# Backend
npm install
npm start  # Port 3000

# Frontend
cd frontend
npm install
npm run dev  # Port 3001
```

## Important Notes
- All integrations are LIVE (no mocks)
- Use BNB Testnet tokens for testing
- Frontend must use HTTP-only cookies for auth (NOT localStorage)
