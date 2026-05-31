async function testRailwayEndpoints() {
  const base = 'https://cobbra-production.up.railway.app';
  
  // 1. Check debug-db to see actual database state on Railway
  const debugUrl = `${base}/api/auth/debug-db`;
  console.log(`🌐 Querying live Railway database state at: ${debugUrl}...`);

  try {
    const debugResponse = await fetch(debugUrl);
    console.log(`📊 Debug Status: ${debugResponse.status}`);
    const debugText = await debugResponse.text();
    if (debugResponse.status === 200) {
      console.log('💎 LIVE DATABASE USERS IN PRODUCTION:');
      console.log(JSON.stringify(JSON.parse(debugText), null, 2));
    } else {
      console.log(`❌ Debug endpoint returned non-200. Body: ${debugText}`);
    }
  } catch (e) {
    console.error('❌ Debug query failed:', e.message);
  }

  console.log('\n-------------------------------------------');

  // 2. Test login on Railway
  const loginUrl = `${base}/api/auth/login`;
  console.log(`🌐 Testing live login on Railway: ${loginUrl}...`);

  try {
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cobbra.com.br',
        password: 'admin'
      })
    });

    console.log(`📊 Login Status: ${loginResponse.status}`);
    console.log(`📝 Response Body: ${await loginResponse.text()}`);
  } catch (e) {
    console.error('❌ Login query failed:', e.message);
  }
}

testRailwayEndpoints();
