const { POST } = require('../app/api/ai/chat/route.js');

// Mock request object
const createMockRequest = (body) => {
  return {
    headers: {
      get: (name) => {
        if (name.toLowerCase() === 'cookie') {
          // Marina's cookie
          return 'cobroo_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItZGVtby0wMDEiLCJlbWFpbCI6Im1hcmluYUBkZW1vLmNvbSIsInJvbGUiOiJ1c2VyIiwibmFtZSI6Ik1hcmluYSBPbGl2ZWlyYSIsImlhdCI6MTc3OTYxNTQ3MH0.some-signature';
        }
        return null;
      }
    },
    json: async () => body
  };
};

async function testChatRoute() {
  console.log('Testing Chat Route...');
  try {
    const req = createMockRequest({
      message: 'Como posso conectar o meu WhatsApp?',
      history: []
    });
    
    const response = await POST(req);
    const resBody = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Body:', resBody);
  } catch (error) {
    console.error('Failed to run chat route:', error);
  }
}

testChatRoute();
