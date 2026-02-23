# ClawOS Web3
**The Gateway to Decentralized AI Agents**

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://agent-os-web3.vercel.app/)
[![Backend API](https://img.shields.io/badge/API-Live-blue)](https://agentos-web3-production.up.railway.app/api/health)

An autonomous agent platform orchestrating AI actions on **BNB Chain** and persisting memory via **Unibase**.

---

## Live Deployment
- **Live Dashboard**: [agentos.vercel.app](https://agentos.vercel.app) (Frontend)
- **Production API**: [agentos-web3-production.up.railway.app](https://agentos-web3-production.up.railway.app) (Backend)
- **Health Status**: [/api/health](https://agentos-web3-production.up.railway.app/api/health)

---

## Integrations (100% Live)

### 1. Quack x ChainGPT (BNB Chain)
- **Feature:** AI Research & Smart Contract Factory
- **Integration:** Uses ChainGPT API for LLM reasoning and solidity generation. Deploys to BNB Testnet.
- **Payments:** Q402 protocol (EIP-7702 delegated payments)
- **Code:** `src/services/chainGPT/`, `src/services/quack/`

### 2. Unibase / Membase
- **Feature:** Decentralized Persistent Memory
- **Integration:** Agent conversations and context stored on Membase Hub (`testnet.hub.membase.io`)
- **Code:** `src/services/memory/MembaseService.js`

---

## Documentation
- **[Installation & Setup](docs/setup/API_KEYS_GUIDE.md)**
- **[Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md)**
- **[Testing & Verification](docs/testing/TESTING_GUIDE.md)**

## Project Structure
```bash
ClawOS-web3/
├── frontend/           # Next.js 15 Dashboard (Vercel)
├── src/               # Express Backend (Railway)
│   ├── services/
│   │   ├── agent/     # AgentOrchestrator, ServiceRegistry, NegotiationEngine
│   │   ├── chainGPT/  # LLMService, AuditorService, GeneratorService
│   │   ├── quack/     # Q402PaymentService (BNB Testnet)
│   │   ├── memory/    # MembaseService (Unibase AIP)
│   │   └── blockchain/ # MultiNetworkService, SwapService, TransferService
│   └── routes/        # API endpoints
└── docs/              # Detailed Guides
```

## Quick Start (Local)
1. **Clone & Install:**
   ```bash
   git clone https://github.com/.git
   npm install      # Backend
   cd frontend && npm install # Frontend
   ```
2. **Environment:**
   - Copy `.env.example` -> `.env`
   - Add keys (see [Setup Guide](docs/setup/API_KEYS_GUIDE.md))
3. **Run:**
   ```bash
   # Backend
   npm start  # Port 3000
   # Frontend
   cd frontend && npm run dev  # Port 3001
   ```
