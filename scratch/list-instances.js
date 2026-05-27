const evoUrl = 'http://129.121.85.166';
const evoToken = 'cobroo-global-token-2026-safe-key';

async function listInstances() {
  try {
    const res = await fetch(`${evoUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': evoToken
      }
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Instances:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

listInstances();
