async function pollRailway() {
  const url = 'https://cobbra-production.up.railway.app/api/auth/debug-db';
  console.log(`📡 Starting live polling on: ${url}...`);

  const maxAttempts = 18; // 3 minutes total
  let attempt = 1;

  const interval = setInterval(async () => {
    console.log(`⏳ Attempt #${attempt}/${maxAttempts}: Checking if new deploy is live...`);
    try {
      const res = await fetch(url);
      if (res.status === 200) {
        console.log('\n🎉 SUCCESS! THE NEW DEPLOY IS LIVE!');
        const text = await res.text();
        const data = JSON.parse(text);
        console.log('💎 LIVE DATABASE USERS IN PRODUCTION:');
        data.users.forEach(u => {
          console.log(`- Name: ${u.name} | Email: ${u.email} | Role: ${u.role} | Hash Prefix: ${u.hash_prefix}`);
        });
        clearInterval(interval);
        process.exit(0);
      } else {
        console.log(`📊 Status Code: ${res.status} (Build still compiling or deploying...)`);
      }
    } catch (e) {
      console.log(`❌ Request failed: ${e.message}`);
    }

    attempt++;
    if (attempt > maxAttempts) {
      console.log('❌ Polling timed out after 3 minutes. Build might still be running.');
      clearInterval(interval);
      process.exit(1);
    }
  }, 10000);
}

pollRailway();
