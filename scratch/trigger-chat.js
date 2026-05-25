async function triggerChat() {
  console.log('Sending request to local /api/ai/chat...');
  
  try {
    const response = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Mock Marina's login session cookie
        'Cookie': 'cobroo_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItZGVtby0wMDEiLCJlbWFpbCI6Im1hcmluYUBkZW1vLmNvbSIsInJvbGUiOiJ1c2VyIiwibmFtZSI6Ik1hcmluYSBPbGl2ZWlyYSIsImlhdCI6MTc3OTYxNTQ3MH0.some-signature'
      },
      body: JSON.stringify({
        message: 'Como posso conectar o meu WhatsApp?',
        history: []
      })
    });

    console.log('Response Status:', response.status);
    const data = await response.json();
    console.log('Response Body:', data);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

triggerChat();
