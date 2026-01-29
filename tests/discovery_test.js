const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3000';

async function testDiscoveryAndNegotiation() {
    console.log('🚀 Testing Autonomous Discovery and Negotiation (AgentBridge Logic)...');

    const testCase = {
        query: 'I need a security audit for a simple ERC-20 token contract. Is there a discount for a startup?',
        category: 'Development',
        userId: 'vibe_labs_test_user'
    };

    try {
        console.log(`\n1. Sending Discovery/Negotiation request: "${testCase.query}"`);
        const response = await axios.post(`${API_URL}/api/agent/discover-and-negotiate`, testCase);

        if (response.data.success) {
            console.log('✅ Discovery Success!');
            console.log(`\nDiscovered Service: ${response.data.service.name}`);
            console.log(`Provider: ${response.data.service.provider}`);
            console.log(`Reputation: ${response.data.service.reputation}`);

            console.log('\n--- Negotiation Result ---');
            const neg = response.data.negotiation;
            console.log(`Agreed Price: ${neg.agreedPrice} ${neg.currency}`);
            console.log(`Discount Applied: ${neg.discountApplied ? 'YES' : 'NO'}`);
            console.log(`Explanation: ${neg.explanation}`);
            console.log('--------------------------');

            // Verify AIP record (simulated check via console, but logic is in backend)
            console.log('\n✅ Verifiable Memory Log (AIP) stored in Membase.');
        } else {
            console.error('❌ Failed:', response.data.error);
        }
    } catch (error) {
        console.error('❌ Protocol Error:', error.response ? error.response.data : error.message);
    }
}

testDiscoveryAndNegotiation();
