# 🤖 AgentOS Web3
**The Gateway to Decentralized AI Agents**

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://agent-os-web3.vercel.app/)
[![Backend API](https://img.shields.io/badge/API-Live-blue)](https://agentos-web3-production.up.railway.app/api/health)

An autonomous agent platform verifying identity on **Base**, orchestrating actions on **BNB Chain**, and persisting memory via **Unibase**.

---

## 🚀 Live Deployment
- **Backend API:** `https://agentos-web3-production.up.railway.app`
### 🌍 Production Infrastructure
- **Live Dashboard**: [agentos.vercel.app](https://agentos.vercel.app) (Frontend)
- **Production API**: [agentos-production.up.railway.app](https://agentos-production.up.railway.app) (Backend)
- **Health Status**: [/api/health](https://agentos-production.up.railway.app/api/health)
- **Smart Contract (ERC-8004):** `0xfba199c705761D98aD1cD98c34C0d544e39c1984` (Base Sepolia)

---

## 🏆 Implementations (100% Live)

### 🔵 1. AWE Network (Base)
### 🟡 2. Quack × ChainGPT (BNB Chain)
- **Feature:** AI Research & Smart Contract Factory.
- **Integration:** Uses ChainGPT API for LLM reasoning and solidity generation. Deploys to BNB Testnet.
- **Code:** `src/services/chainGPT/`, `src/services/blockchain/MultiNetworkService.js`

### 🧠 3. Unibase / Membase
- **Feature:** Decentralized Persistent Memory.
- **Integration:** Agent conversations and context stored on Membase Hub (`testnet.hub.membase.io`).
- **Code:** `src/services/memory/MembaseService.js`

---

## 📚 Documentation
- **[Installation & Setup](docs/setup/API_KEYS_GUIDE.md)**
- **[Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md)**
- **[Testing & Verification](docs/testing/TESTING_GUIDE.md)**
- **[Final Sign-Off](docs/FINAL_SIGNOFF.md)**

## 🛠 Project Structure
```bash
AgentOS-web3/
├── frontend/           # Next.js 14 Dashboard (Vercel)
├── src/               # Express Backend (Railway)
├── contracts/         # Solidity Smart Contracts (Hardhat)
└── docs/              # Detailed Guides
```

## ⚡ Quick Start (Local)
1. **Clone & Install:**
   ```bash
   git clone https://github.com/RicheySon/AgentOS-web3.git
   npm install      # Backend
   cd frontend && npm install # Frontend
   ```
2. **Environment:**
   - Copy `.env.example` -> `.env`
   - Add keys (see [Setup Guide](docs/setup/API_KEYS_GUIDE.md))
3. **Run:**
   ```bash
   # Backend
   npm run dev
   # Frontend
   cd frontend && npm run dev
   ```

---




