/**
 * COBROO - Pix EMV Static Payload Generator (BR Code)
 * Generates official Central Bank of Brazil compliant Pix Copy & Paste codes
 */

/**
 * Calculates CRC16 CCITT (0x1021) for the EMV string
 * @param {string} str 
 * @returns {string} - 4-character hex string in uppercase
 */
function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    let x = ((crc >> 8) ^ str.charCodeAt(i)) & 0xFF;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ (x << 1)) & 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formats a block in EMV format (ID + Length + Value)
 * @param {string} id 
 * @param {string} val 
 * @returns {string}
 */
function emvBlock(id, val) {
  const len = val.length.toString().padStart(2, '0');
  return `${id}${len}${val}`;
}

/**
 * Generates a static Pix Copia e Cola code
 * @param {Object} options
 * @param {string} options.key - Pix Key (CPF, CNPJ, Email, Phone, or Random Key)
 * @param {number} options.amount - Updated debt value
 * @param {string} options.name - Receiver name (max 25 chars)
 * @param {string} [options.city] - Receiver city (max 15 chars, default: SAO PAULO)
 * @param {string} [options.txid] - Transaction ID (default: COBBRA)
 * @returns {string} - The full Pix Copia e Cola code
 */
function generateStaticPix({ key, amount, name, city = 'SAO PAULO', txid = 'COBBRA' }) {
  if (!key) return '';

  // Format key (remove spaces, parentheses, hyphens if phone number)
  let cleanKey = key.trim();

  // 1. Payload Format Indicator
  let payload = emvBlock('00', '01');

  // 2. Merchant Account Information - Pix Domain & Key
  const pixDomain = emvBlock('00', 'br.gov.bcb.pix');
  const pixKeyBlock = emvBlock('01', cleanKey);
  const merchantAccountInfo = emvBlock('26', `${pixDomain}${pixKeyBlock}`);
  payload += merchantAccountInfo;

  // 3. Merchant Category Code (MCC)
  payload += emvBlock('52', '0000');

  // 4. Transaction Currency (BRL = 986)
  payload += emvBlock('53', '986');

  // 5. Transaction Amount (formatted to 2 decimal places)
  if (amount && amount > 0) {
    payload += emvBlock('54', amount.toFixed(2));
  }

  // 6. Country Code (BR)
  payload += emvBlock('58', 'BR');

  // 7. Merchant Name (clean special characters, max 25 chars)
  const cleanName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .substring(0, 25)
    .trim();
  payload += emvBlock('59', cleanName || 'COBBRA RECEBEDOR');

  // 8. Merchant City (max 15 chars)
  const cleanCity = city
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .substring(0, 15)
    .trim();
  payload += emvBlock('60', cleanCity || 'SAO PAULO');

  // 9. Additional Data Field Template (txid)
  const cleanTxid = txid
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 25)
    .trim();
  const txidBlock = emvBlock('05', cleanTxid || 'COBBRA');
  payload += emvBlock('62', txidBlock);

  // 10. CRC16 Checksum
  payload += '6304';
  const checksum = crc16(payload);
  
  return `${payload}${checksum}`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateStaticPix
  };
}
// ESM Named Export
export { generateStaticPix };

