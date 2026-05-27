const evoUrl = 'http://129.121.85.166';
const evoToken = 'cobroo-global-token-2026-safe-key';
const instance = 'cobbra_inst_user-dem'; // active open instance from fetchInstances
const waNumber = '5511988888888'; // dummy/fake number

async function test() {
  console.log('Sending message to fake number via active instance...');
  try {
    const res = await fetch(`${evoUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evoToken
      },
      body: JSON.stringify({
        number: waNumber,
        text: 'Teste de Cobrança Avulsa',
        delay: 1200
      })
    });
    console.log('Response Status:', res.status);
    const body = await res.json();
    console.log('Response Body:', JSON.stringify(body, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
