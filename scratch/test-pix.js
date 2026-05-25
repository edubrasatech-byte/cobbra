const { generateStaticPix } = require('../lib/pix');

try {
  const user = {
    pix_key: '11987654321',
    name: 'Marina Oliveira',
    business_name: 'Studio Marina Personal'
  };
  
  const amount = 150.00;
  
  console.log('Generating Pix with details:', user, 'Amount:', amount);
  const pixCode = generateStaticPix({
    key: user.pix_key,
    amount: amount,
    name: user.business_name || user.name
  });
  
  console.log('Resulting pixCode:', `"${pixCode}"`);
} catch (e) {
  console.error('Error during Pix generation:', e);
}
