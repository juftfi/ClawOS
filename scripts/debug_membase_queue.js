(async function(){
  const MembaseService = require('../src/services/memory/MembaseService');
  console.log('Initial queue length:', MembaseService.operationQueue.length);
  MembaseService.isConnected = true;
  MembaseService.storage = {
    uploadHub: async () => { const e = new Error('Rate limited'); e.response = { status: 429 }; throw e; }
  };
  try{
    const res = await MembaseService.storeConversation('agent1','Test','Response');
    console.log('storeConversation result:', res);
  } catch(e) {
    console.log('storeConversation threw:', e.message);
  }
  console.log('Final queue length:', MembaseService.operationQueue.length);
})();
