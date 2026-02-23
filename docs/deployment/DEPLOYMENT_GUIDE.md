# 🚀 ClawOS-Web3 Deployment Guide

This guide covers how to deploy the full stack (Frontend + Backend) for live access.

## 📦 Prerequisites
- GitHub Account (you have this, and code is pushed to `release/final-submission`)
- [Vercel Account](https://vercel.com) (for Frontend)
- [Railway Account](https://railway.app) or [Render Account](https://render.com) (for Backend)
- Your `.env` variables ready

---

## 1️⃣ Deploy Backend (Express API)
*Crucial: The frontend needs a live API URL, not localhost, to work for others.*

### Option A: Railway (Recommended - Fastest)
1.  Login to [Railway Dashboard](https://railway.app).
2.  Click **"New Project"** -> **"Deploy from GitHub repo"**.
3.  Select `ClawOS-web3`.
4.  **Configure Service:**
    - **Root Directory:** `/` (default is fine)
    - **Build Command:** `npm install`
    - **Start Command:** `node src/index.js`
5.  **Variables:** Go to the "Variables" tab and add:
    - `BASE_SEPOLIA_RPC`: (Your URL)
    - `BASE_PRIVATE_KEY`: (Your Key)
    - `BNB_TESTNET_RPC`: (Your URL)
    - `CHAINGPT_API_KEY`: (Your Key)
    - `BASE_CONTRACT_ADDRESS`: `0xfba199c705761D98aD1cD98c34C0d544e39c1984` (The one we deployed)
6.  **Deploy:** Click Deploy.
7.  **Get URL:** Copy the provided `https://...up.railway.app` URL.

---

## 2️⃣ Deploy Frontend (Next.js)
*Deploy this AFTER you have your Backend URL.*

1.  Login to [Vercel Dashboard](https://vercel.com).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import `ClawOS-web3`.
4.  **Framework Preset:** `Next.js`.
5.  **Root Directory:** ⚠️ **IMPORTANT:** Click "Edit" and select `frontend`.
6.  **Environment Variables:**
    - `NEXT_PUBLIC_API_URL`: **(Paste your Railway Backend URL here)** e.g., `https://agentos-backend.up.railway.app` (No trailing slash)
    - `NEXT_PUBLIC_CONTRACT_ADDRESS`: `0xfba199c705761D98aD1cD98c34C0d544e39c1984`
    - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: `a359f797c1fa6f0077a3fd75176899d5`
7.  **Deploy:** Click "Deploy".

---

## 3️⃣ Verification
1.  Visit your new Vercel URL (e.g., `https://agentos-web3.vercel.app`).
2.  Connect Wallet.
3.  Check "Agents" tab - it should load agents (proving Backend connection).
4.  Check "Chat" tab - it should reply (proving ChainGPT connection).

**Done! You are live.**
