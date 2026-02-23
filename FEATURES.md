# ClawOS-web3 Features Documentation

## Table of Contents
- [Overview](#overview)
- [Core Features](#core-features)
- [Recent Test Infrastructure Improvements](#recent-test-infrastructure-improvements)
- [Technical Stack](#technical-stack)
- [Coverage Metrics](#coverage-metrics)

---

## Overview

**ClawOS-web3** is a Node.js backend service that provides blockchain integration, AI-powered agent capabilities, payment processing, and smart contract interaction on the BNB Smart Chain (BSC).

**Key Capabilities:**
- 🔐 X402 Payment Protocol Implementation
- 🤖 ChainGPT AI Integration
- 💾 Unibase Memory Management
- ⛓️ Blockchain Services (BNB/BSC)
- 📝 Smart Contract Deployment & Interaction
- 💰 Token Swaps via PancakeSwap
- 🔍 Transaction Auditing & Risk Assessment

---

## Core Features

### 1. X402 Payment Protocol

**Location:** `src/services/x402/`

#### PaymentService
- **Payment Sessions:** Initialize and manage payment sessions with nonces and expiration
- **Payment Preparation:** Validate payments against policies before execution
- **Payment Verification:** Cryptographic signature verification using x402 standard
- **Payment Execution:** Execute transfers, swaps, and contract calls
- **Payment History:** Query and retrieve transaction history
- **Risk Assessment:** Automated risk scoring based on amount, policy compliance, and recipient validation
- **Policy Creation:** Custom payment policies per user

**Key Methods:**
```javascript
- initializePaymentSession(userId, agentAction)
- preparePayment(amount, recipient, metadata)
- verifyPayment(x402Signature, paymentDetails)
- executePayment(x402Signature, paymentDetails)
- getPaymentHistory(userId, limit)
- assessRisk(paymentDetails, compliance)
```

#### PolicyService
- **Policy Management:** Create, store, and retrieve payment policies
- **Compliance Checking:** Real-time validation against spending limits and transaction counts
- **Address Lists:** Whitelist/blacklist functionality for recipients
- **Daily Tracking:** Monitor spending and transaction counts per user
- **Limit Enforcement:** Single transaction limits, daily spending limits, daily transaction counts
- **Warnings:** Proactive notifications when approaching limits

**Key Methods:**
```javascript
- checkPolicyCompliance(payment, userId)
- setSpendingLimit(userId, limit)
- recordPayment(userId, payment)
- setAllowedAddresses(userId, addresses)
- setDeniedAddresses(userId, addresses)
- getPolicySummary(userId)
```

#### SignatureService
- **Payment Signatures:** Generate EIP-712 structured data signatures
- **Signature Verification:** Verify x402 payment signatures
- **Contract Call Signing:** Sign smart contract interactions
- **Message Signing:** Generic message signing capabilities

**Key Methods:**
```javascript
- generatePaymentSignature(paymentDetails)
- verifySignature(signature, paymentDetails)
- createSingleTxSignature(txDetails)
- signContractCall(contractCall)
```

---

### 2. Blockchain Services

**Location:** `src/services/blockchain/`

#### BlockchainService
- **Web3 Provider:** BNB Smart Chain (BSC) connection management
- **Account Management:** Wallet creation and private key handling
- **Gas Estimation:** Automatic gas limit and price calculation
- **Address Validation:** BNB address format verification
- **Network Info:** Chain ID, block number, and network status

#### ContractDeployService
- **Smart Contract Deployment:** Deploy contracts with constructor arguments
- **Deployment Verification:** Verify contract existence on-chain
- **Cost Estimation:** Pre-deployment gas cost calculation
- **Batch Deployment:** Deploy multiple contracts in sequence
- **Creation TX Lookup:** Find contract creation transaction (requires indexer)

**Key Methods:**
```javascript
- deployContract(contractCode, abi, constructorArgs, gasLimit)
- verifyDeployment(contractAddress)
- estimateDeploymentCost(contractCode, abi, constructorArgs)
- batchDeploy(contracts)
```

#### ContractCallService
- **Read Operations:** Call view/pure contract methods
- **Write Operations:** Execute state-changing contract methods
- **Batch Calls:** Execute multiple contract reads in parallel
- **Event Retrieval:** Query past contract events
- **Contract State:** Read multiple contract values at once
- **ABI Encoding/Decoding:** Encode function calls and decode responses
- **Event Parsing:** Parse events from transaction receipts

**Key Methods:**
```javascript
- callContractMethod(contractAddress, methodName, params, abi)
- writeContractMethod(contractAddress, methodName, params, abi, value)
- getContractState(contractAddress, abi, methods)
- batchCall(contractAddress, calls, abi)
- getContractEvents(contractAddress, abi, eventName, fromBlock, toBlock)
- encodeFunctionCall(methodName, params, abi)
- decodeFunctionCall(data, abi)
```

#### SwapService
- **Token Swaps:** Execute token swaps via PancakeSwap Router
- **Swap Preparation:** Calculate expected output and slippage
- **Price Quotes:** Get exchange rates without executing swaps
- **Token Approvals:** Automatic ERC20 approval handling
- **Slippage Protection:** Configurable slippage tolerance
- **Price Impact Calculation:** Display price impact for swaps

**Key Methods:**
```javascript
- prepareSwap(fromToken, toToken, amount, slippage)
- executeSwap(fromToken, toToken, amount, slippage)
- getSwapPrice(fromToken, toToken, amount)
- approveToken(tokenAddress, amount)
```

#### TransferService
- **BNB Transfers:** Native BNB token transfers
- **ERC20 Transfers:** Transfer any ERC20 token
- **Batch Transfers:** Send to multiple recipients
- **Transfer History:** Query past transfers

---

### 3. AI & Agent Services

**Location:** `src/services/chainGPT/`, `src/services/agent/`

#### ChainGPT Integration
- **AI Chat:** Interact with ChainGPT AI models
- **Blockchain Queries:** AI-powered blockchain data analysis
- **Smart Contract Analysis:** Code review and security insights

#### Agent Services
- **Auditor Service:** Transaction and contract auditing with AI assistance
- **Generator Service:** Generate smart contract code, tests, and documentation
- **LLM Service:** Generic large language model interactions

---

### 4. Memory & Data Management

**Location:** `src/services/memory/`

#### MembaseService
- **Data Storage:** Persistent storage for user preferences, transaction history
- **Querying:** Retrieve data by user ID, filters, and limits
- **Preferences:** Store and retrieve user-specific settings
- **Memory Retrieval:** Context-aware memory for agent interactions

#### ConversationManager
- **Conversation Tracking:** Maintain conversation history
- **Context Management:** Store conversation context for continuity

#### PreferenceManager
- **User Preferences:** Store payment policies, address lists, settings
- **Settings Retrieval:** Get user-specific configurations

---

### 5. Preview & Risk Services

**Location:** `src/services/preview/`, `src/services/risk/`

#### PreviewService
- **Payment Preview:** Show estimated costs, gas, and outcomes before execution
- **Swap Preview:** Display expected swap results with slippage

#### RiskAssessmentService
- **Risk Scoring:** Automated risk analysis for transactions
- **Warning System:** Flag high-risk operations
- **Policy Violation Detection:** Identify non-compliant transactions

---

## Recent Test Infrastructure Improvements

### Test Coverage Expansion (December 2025)

**Achievement:** Increased overall test coverage from **46.6%** to **57%+**

#### New Test Suites Created

1. **ContractDeploy.test.js** (15 tests)
   - Contract deployment with various configurations
   - Gas estimation and error handling
   - Deployment verification
   - Batch deployment scenarios

2. **ContractCall.test.js** (18 tests)
   - Read and write contract operations
   - Batch call functionality
   - Event retrieval and parsing
   - ABI encoding/decoding
   - Error handling for invalid operations

#### Enhanced Test Suites

3. **Payment.test.js** (21 tests, 74% coverage)
   - Payment session management
   - Nonce generation and tracking
   - Payment verification with signature validation
   - Payment execution for transfers
   - Risk assessment logic
   - Payment history retrieval

4. **Policy.test.js** (23 tests, 82% coverage)
   - Policy compliance checking
   - Spending limit enforcement
   - Transaction count limits
   - Address whitelist/blacklist
   - Daily tracking and warnings
   - Policy summary generation

5. **Signature.test.js** (82% coverage)
   - EIP-712 signature generation
   - Signature verification
   - Contract call signing
   - Message signing utilities

### Testing Infrastructure

**Test Framework:**
- **Jest** 30.2.0 with coverage reporting
- **Supertest** for API endpoint testing
- Comprehensive mocking for external dependencies (Web3, Axios, UUID)

**Coverage Metrics (Current):**
```
Overall Coverage:     57.06% statements
                      44.37% branches
                      57.39% lines
                      61.67% functions

Service-Specific:
- PaymentService:     74.01%
- PolicyService:      82.63%
- SignatureService:   82.60%
- ContractCallService: ~80% (estimated)
- ContractDeployService: ~85% (estimated)
```

**Test Commands:**
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

---

## Technical Stack

### Backend Framework
- **Node.js** with Express 5.2.1
- **CommonJS** module system
- REST API architecture

### Blockchain
- **Web3.js** 4.16.0 for BNB Smart Chain interaction
- **PancakeSwap** integration for token swaps
- **EIP-712** typed data signing

### Security
- **Helmet** for HTTP security headers
- **CORS** configuration
- **x402** payment protocol signatures
- Policy-based transaction validation

### Development Tools
- **Nodemon** for development
- **Morgan** for HTTP logging
- **dotenv** for environment configuration
- **Jest** for testing
- **ESLint** (recommended)

### External Integrations
- **ChainGPT API** for AI capabilities
- **Unibase** for data persistence
- **BNB Smart Chain** (Testnet & Mainnet)

---

## API Endpoints

### Health Check
```
GET /health
```

### X402 Payment Protocol
```
POST /x402/session/init
POST /x402/payment/prepare
POST /x402/payment/verify
POST /x402/payment/execute
GET  /x402/payment/history/:userId
POST /x402/policy/create
GET  /x402/policy/:userId
```

### Blockchain Operations
```
POST /blockchain/contract/deploy
POST /blockchain/contract/call
GET  /blockchain/contract/state/:address
POST /blockchain/swap/prepare
POST /blockchain/swap/execute
GET  /blockchain/swap/price
POST /blockchain/transfer
```

### ChainGPT
```
POST /chaingpt/chat
POST /chaingpt/analyze
```

---

## Environment Configuration

Required environment variables:

```bash
# Server
PORT=3000
NODE_ENV=development

# Blockchain
BNB_RPC_URL=https://bsc-testnet.public.blastapi.io
BNB_WALLET_ADDRESS=0x...
BNB_PRIVATE_KEY=0x...
CHAIN_ID=97

# ChainGPT
CHAINGPT_API_KEY=your_api_key

# Unibase
UNIBASE_API_URL=https://api.unibase.io
UNIBASE_API_KEY=your_api_key
```

---

## Usage Examples

### Payment with Policy Enforcement

```javascript
// 1. Initialize payment session
const session = await paymentService.initializePaymentSession('user123', 'transfer');

// 2. Prepare payment (checks policy)
const prepared = await paymentService.preparePayment(
  '0.5',
  '0xRecipientAddress',
  { 
    user_id: 'user123',
    action: 'transfer'
  }
);

// 3. Generate signature
const signature = await signatureService.generatePaymentSignature(prepared.payment);

// 4. Execute payment
const result = await paymentService.executePayment(signature, prepared.payment);
```

### Smart Contract Deployment

```javascript
// Deploy a contract
const deployment = await contractDeployService.deployContract(
  bytecode,
  abi,
  ['constructor', 'args'],
  5000000 // optional gas limit
);

console.log('Contract deployed at:', deployment.contract_address);
```

### Token Swap

```javascript
// Get quote first
const quote = await swapService.getSwapPrice('BNB', 'USDT', '1.0');

// Execute swap with 0.5% slippage
const swapResult = await swapService.executeSwap('BNB', 'USDT', '1.0', 0.5);
```

---

## Future Enhancements

### Planned Features
- [ ] Multi-signature wallet support
- [ ] Cross-chain bridge integration
- [ ] GraphQL API
- [ ] WebSocket for real-time updates
- [ ] Advanced analytics dashboard
- [ ] Automated test generation for contracts
- [ ] Additional DEX integrations (Uniswap, 1inch)

### Testing Goals
- [ ] Reach 80% overall test coverage
- [ ] Add integration tests for API endpoints
- [ ] Performance benchmarking
- [ ] Load testing for concurrent requests

---

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure coverage doesn't drop below current levels
3. Update this documentation
4. Follow existing code patterns
5. Add JSDoc comments

---

## License

ISC

---

## Contact & Support

- **Repository:** https://github.com/RicheySon/ClawOS-web3
- **Issues:** https://github.com/RicheySon/ClawOS-web3/issues

---

**Last Updated:** December 4, 2025  
**Version:** 1.0.0  
**Test Coverage:** 57%+ (213 passing tests)
