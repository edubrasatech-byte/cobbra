async function checkProductionDatabase() {
  const url = 'https://cobbra.com.br/api/auth/debug-db';
  console.log(`🌐 Querying live database stats at: ${url}...`);

  try {
    const response = await fetch(url);
    const status = response.status;
    const text = await response.text();

    console.log(`📊 Status Code: ${status}`);
    if (status === 200) {
      console.log('\n💎 LIVE PRODUCTION DATABASE DETAILS:');
      const data = JSON.parse(text);
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Failed. Response: ${text}`);
    }
  } catch (e) {
    console.error('❌ Connection error:', e.message);
  }
}

// Wait 10 seconds before running to give Railway a bit of time to complete the deployment
console.log('⏳ Waiting 10 seconds for Railway deploy to finish...');
setTimeout(checkProductionDatabase, 10000);
