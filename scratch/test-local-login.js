async function testLocalLogin() {
  const url = 'http://localhost:3000/api/auth/login';
  console.log(`🌐 Testing local login against: ${url}...`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cobbra.com.br',
        password: 'admin'
      })
    });

    const status = response.status;
    const text = await response.text();
    console.log(`📊 Status Code: ${status}`);
    console.log(`📝 Response Body: ${text}`);

  } catch (e) {
    console.error('❌ Connection error:', e.message);
  }
}

testLocalLogin();
