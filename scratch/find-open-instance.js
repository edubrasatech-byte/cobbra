const apikey = 'cobroo-global-token-2026-safe-key';
const instances = [
  'cobbra_inst_399c72fd',
  'cobbra_inst_test_qr_v6',
  'cobbra-outreach',
  'cobbra_inst_user-dem',
  'cobbra_inst_admin-se'
];

console.log('🔍 Checando o estado de todas as 5 instâncias...');

async function check() {
  for (const name of instances) {
    try {
      const res = await fetch(`http://129.121.85.166/instance/connectionState/${name}`, {
        headers: { 'apikey': apikey }
      });
      const data = await res.json();
      console.log(`📡 Instância: ${name} | Estado: ${data.instance?.state || 'erro'}`);
    } catch (e) {
      console.log(`❌ Instância: ${name} | Falhou: ${e.message}`);
    }
  }
}

check();
