const evoUrl = 'http://129.121.85.166';
const instance = 'cobbra_inst_user-dem';

async function testToken(token, label) {
  try {
    const res = await fetch(`${evoUrl}/instance/connectionState/${instance}`, {
      method: 'GET',
      headers: {
        'apikey': token,
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(`[${label}] Token: "${token}" -> Status: ${res.status}`);
    const data = await res.json().catch(() => ({}));
    console.log(`[${label}] Response:`, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`[${label}] Error:`, err.message);
  }
}

async function run() {
  await testToken('cobroo-global-token-2026-safe-key', 'COBROO KEY');
  console.log('--------------------------------------------------');
  await testToken('cobbra-global-token-2026-safe-key', 'COBBRA KEY');
  console.log('--------------------------------------------------');
  await testToken('415B7DDE-0D27-4B50-AC7D-82B4CDAF6C70', 'INSTANCE SPECIFIC KEY');
}

run();
