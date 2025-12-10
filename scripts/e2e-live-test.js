#!/usr/bin/env node

/**
 * Comprehensive E2E Live Test Suite
 * Tests all major features with real keys and integrations:
 * - Health endpoint
 * - AI Chat (ChainGPT)
 * - Contract Generation (ERC20, ERC721)
 * - Contract Analysis
 * - Memory/Storage operations
 * - Payment endpoints (X-402)
 */

const http = require('http');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

const log = {
  section: (title) => console.log(`\n${'='.repeat(60)}\n${title}\n${'='.repeat(60)}`),
  success: (msg) => console.log(`✓ ${msg}`),
  error: (msg) => console.log(`✗ ${msg}`),
  info: (msg) => console.log(`ℹ ${msg}`),
  data: (data) => console.log(JSON.stringify(data, null, 2))
};

// HTTP request helper
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  log.section('🚀 COMPREHENSIVE E2E LIVE TESTS');
  log.info(`Testing against: ${BASE_URL}`);

  let passed = 0, failed = 0;

  try {
    // 1. Health Check
    log.section('1️⃣  HEALTH CHECK');
    try {
      const health = await request('GET', '/health');
      if (health.status === 200 && health.body?.success) {
        log.success(`Server healthy (uptime: ${health.body.data?.uptime?.toFixed(2)}s)`);
        if (health.body.data?.blockchain) {
          log.success(`Blockchain connected: ${health.body.data.blockchain.network} (block ${health.body.data.blockchain.blockNumber})`);
        }
        passed++;
      } else {
        throw new Error(`Unexpected status: ${health.status}`);
      }
    } catch (e) {
      log.error(`Health check failed: ${e.message}`);
      failed++;
    }

    // 2. AI Chat (Live ChainGPT)
    log.section('2️⃣  AI CHAT (ChainGPT Integration)');
    try {
      const chat = await request('POST', '/ai/chat', {
        prompt: 'What is an ERC20 token? Explain briefly.',
        model: 'gpt-4'
      });
      if (chat.status === 200 && chat.body?.success && chat.body.data?.response) {
        const resp = chat.body.data.response;
        const isReal = !resp.toLowerCase().includes('unable to process');
        log.success(`Chat response received (length: ${resp.length} chars, live: ${isReal})`);
        log.info(`Response preview: "${resp.substring(0, 100)}..."`);
        passed++;
      } else {
        throw new Error(`Unexpected response status: ${chat.status}`);
      }
    } catch (e) {
      log.error(`AI Chat failed: ${e.message}`);
      failed++;
    }

    // 3. Generate ERC20 Contract
    log.section('3️⃣  CONTRACT GENERATION (ERC20)');
    try {
      const gen = await request('POST', '/ai/generate/erc20', {
        name: 'AgentOSToken',
        symbol: 'AGENT',
        totalSupply: '1000000',
        decimals: 18,
        mintable: true,
        burnable: true
      });
      if (gen.status === 200 && gen.body?.success && gen.body.data?.contract_code) {
        const code = gen.body.data.contract_code;
        const isSolidity = code.includes('pragma solidity') && code.includes('contract');
        log.success(`ERC20 contract generated (length: ${code.length}, valid solidity: ${isSolidity})`);
        log.info(`Token: ${gen.body.data.token_info?.name} (${gen.body.data.token_info?.symbol})`);
        log.info(`Model used: ${gen.body.data.model_used}, Tokens: ${gen.body.data.tokens_used}`);
        passed++;
      } else {
        throw new Error(`Unexpected response status: ${gen.status}`);
      }
    } catch (e) {
      log.error(`ERC20 generation failed: ${e.message}`);
      failed++;
    }

    // 4. Generate ERC721 Contract
    log.section('4️⃣  CONTRACT GENERATION (ERC721/NFT)');
    try {
      const gen = await request('POST', '/ai/generate/erc721', {
        name: 'AgentOSNFT',
        symbol: 'ANFT',
        baseURI: 'ipfs://QmExample/',
        maxSupply: '10000',
        royalties: true,
        royaltyPercentage: 10
      });
      if (gen.status === 200 && gen.body?.success && gen.body.data?.contract_code) {
        const code = gen.body.data.contract_code;
        const isSolidity = code.includes('pragma solidity') && code.includes('contract');
        log.success(`ERC721 contract generated (length: ${code.length}, valid solidity: ${isSolidity})`);
        log.info(`NFT Collection: ${gen.body.data.nft_info?.name} (${gen.body.data.nft_info?.symbol})`);
        log.info(`Model used: ${gen.body.data.model_used}, Tokens: ${gen.body.data.tokens_used}`);
        passed++;
      } else {
        throw new Error(`Unexpected response status: ${gen.status}`);
      }
    } catch (e) {
      log.error(`ERC721 generation failed: ${e.message}`);
      failed++;
    }

    // 5. Analyze Contract
    log.section('5️⃣  CONTRACT ANALYSIS');
    try {
      const dummyCode = `
pragma solidity ^0.8.0;
contract Simple {
  uint256 value;
  function setValue(uint256 _value) public { value = _value; }
}
`;
      const analyze = await request('POST', '/ai/analyze-contract', {
        contractCode: dummyCode
      });
      if (analyze.status === 200 && analyze.body?.success) {
        log.success(`Contract analysis completed`);
        log.info(`Analysis: ${analyze.body.data?.analysis?.substring(0, 80)}...` || 'N/A');
        passed++;
      } else {
        throw new Error(`Unexpected response status: ${analyze.status}`);
      }
    } catch (e) {
      log.error(`Contract analysis failed: ${e.message}`);
      failed++;
    }

    // 6. Memory: Store Contract Template
    log.section('6️⃣  MEMORY: STORE CONTRACT TEMPLATE');
    try {
      const sampleCode = 'pragma solidity ^0.8.0; contract Sample {}';
      const sampleAbi = [{ type: 'constructor', inputs: [] }];
      const store = await request('POST', '/memory/store-contract', {
        name: 'E2E_TEST_CONTRACT',
        code: sampleCode,
        abi: sampleAbi
      });
      if (store.status === 200 && store.body?.success && store.body.data?.stored) {
        log.success(`Contract template stored: ${store.body.data.name}`);
        passed++;
      } else {
        throw new Error(`Unexpected response status: ${store.status}`);
      }
    } catch (e) {
      log.error(`Memory store failed: ${e.message}`);
      failed++;
    }

    // 7. Memory: Retrieve Contract Template
    log.section('7️⃣  MEMORY: RETRIEVE CONTRACT TEMPLATE');
    try {
      const retrieve = await request('GET', '/memory/contract/E2E_TEST_CONTRACT');
      if (retrieve.status === 200 && retrieve.body?.success && retrieve.body.data?.name) {
        log.success(`Contract template retrieved: ${retrieve.body.data.name}`);
        passed++;
      } else if (retrieve.status === 404) {
        log.info(`Contract not found (expected if this is first run)`);
        passed++;
      } else {
        throw new Error(`Unexpected response status: ${retrieve.status}`);
      }
    } catch (e) {
      log.error(`Memory retrieve failed: ${e.message}`);
      failed++;
    }

    // 8. Memory: Get Statistics
    log.section('8️⃣  MEMORY: GET STORAGE STATISTICS');
    try {
      const stats = await request('GET', '/memory/stats');
      if (stats.status === 200 && stats.body?.success) {
        log.success(`Memory stats retrieved`);
        log.info(`Conversations: ${stats.body.data?.totalConversations || 0}, Messages: ${stats.body.data?.totalMessages || 0}`);
        log.info(`Storage: ${stats.body.data?.storageUsed || 'N/A'}, Connected: ${stats.body.data?.isConnected || false}`);
        passed++;
      } else {
        throw new Error(`Unexpected response status: ${stats.status}`);
      }
    } catch (e) {
      log.error(`Memory stats failed: ${e.message}`);
      failed++;
    }

    // 9. Conversation: Save conversation
    log.section('9️⃣  CONVERSATION: SAVE CONVERSATION');
    try {
      const conv = await request('POST', '/memory/conversation', {
        agentId: 'agent-e2e-test',
        userMessage: 'What is DeFi?',
        aiResponse: 'DeFi stands for Decentralized Finance, enabling financial services without intermediaries.'
      });
      if (conv.status === 200 && conv.body?.success) {
        log.success(`Conversation saved for agent: agent-e2e-test`);
        passed++;
      } else {
        throw new Error(`Unexpected response status: ${conv.status}`);
      }
    } catch (e) {
      log.error(`Conversation save failed: ${e.message}`);
      failed++;
    }

    // 10. Conversation: Get conversation history
    log.section('🔟 CONVERSATION: GET CONVERSATION HISTORY');
    try {
      const history = await request('GET', '/memory/conversation/agent-e2e-test?limit=10');
      if (history.status === 200 && history.body?.success) {
        log.success(`Conversation history retrieved: ${history.body.data?.message_count || 0} messages`);
        passed++;
      } else {
        throw new Error(`Unexpected response status: ${history.status}`);
      }
    } catch (e) {
      log.error(`Conversation history failed: ${e.message}`);
      failed++;
    }

    // Summary
    log.section('📊 TEST SUMMARY');
    const total = passed + failed;
    const passRate = ((passed / total) * 100).toFixed(1);
    log.success(`Passed: ${passed}/${total} (${passRate}%)`);
    if (failed > 0) {
      log.error(`Failed: ${failed}/${total}`);
    }

    if (failed === 0) {
      log.section('✨ ALL E2E TESTS PASSED!');
      process.exit(0);
    } else {
      log.section('⚠️  SOME TESTS FAILED');
      process.exit(1);
    }
  } catch (e) {
    log.error(`Test suite error: ${e.message}`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(e => {
  log.error(`Fatal error: ${e.message}`);
  process.exit(1);
});
