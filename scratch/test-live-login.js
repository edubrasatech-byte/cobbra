async function testLiveLogin() {
  const domains = [
    'https://cobbra.com.br',
    'http://cobbra.com.br',
    'https://cobbra.ai',
    'http://localhost:3000'
  ];

  for (const domain of domains) {
    const url = `${domain}/api/auth/login`;
    console.log(`🌐 Testing live login against: ${url}...`);

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

      if (status === 200) {
        console.log(`🎉 SUCCESS ON DOMAIN: ${domain}!\n`);
        break;
      }
    } catch (e) {
      console.error(`❌ Connection error on ${domain}:`, e.message);
    }
    console.log('-------------------------------------------');
  }
}

testLiveLogin();
