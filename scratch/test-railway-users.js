async function checkProductionUsers() {
  const base = 'https://cobbra-production.up.railway.app';
  const debugUrl = `${base}/api/auth/debug-db`;
  console.log(`🌐 Querying live Railway users at: ${debugUrl}...`);

  try {
    const res = await fetch(debugUrl);
    console.log(`📊 Status Code: ${res.status}`);
    const text = await res.text();
    if (res.status === 200) {
      const data = JSON.parse(text);
      console.log('✅ Connected to database successfully!');
      console.log('Active Database Path:', data.activeDatabasePath);
      console.log('Users in production:');
      data.users.forEach(u => {
        console.log(`- ${u.name} | ${u.email} | Role: ${u.role} | Prefix: ${u.hash_prefix}`);
      });
    } else {
      console.log(`❌ Non-200 status. Body length: ${text.length}`);
      console.log('First 200 chars of body:', text.substring(0, 200));
    }
  } catch (e) {
    console.error('❌ Fetch failed:', e.message);
  }
}

checkProductionUsers();
