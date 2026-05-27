const evoUrl = 'http://129.121.85.166';
const evoToken = 'cobroo-global-token-2026-safe-key';
const instance = 'cobbra_master'; // or cobroo_master
const waNumber = '5511999999999'; // dummy test number

async function test() {
  console.log('--- TESTING PAYLOAD 1 (textMessage) ---');
  try {
    const res1 = await fetch(`${evoUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evoToken
      },
      body: JSON.stringify({
        number: waNumber,
        options: { delay: 1200, linkPreview: true },
        textMessage: { text: 'Teste 1' }
      })
    });
    console.log('Status Payload 1:', res1.status);
    const body1 = await res1.text();
    console.log('Body Payload 1:', body1);
  } catch (err) {
    console.error('Error Payload 1:', err);
  }

  console.log('\n--- TESTING PAYLOAD 2 (simple text) ---');
  try {
    const res2 = await fetch(`${evoUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evoToken
      },
      body: JSON.stringify({
        number: waNumber,
        text: 'Teste 2',
        delay: 1200
      })
    });
    console.log('Status Payload 2:', res2.status);
    const body2 = await res2.text();
    console.log('Body Payload 2:', body2);
  } catch (err) {
    console.error('Error Payload 2:', err);
  }
}

test();
