const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || `"Cobbra Suporte" <${SMTP_USER || 'suporte@cobbra.com.br'}>`;

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('[MAILER WARNING] SMTP credentials are not configured! Emails will be simulated in the console logs.');
    return null;
  }

  // Hostinger secure SMTP configuration (usually port 465 with SSL/TLS)
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    // Useful for TLS compatibility in different hosting environments
    tls: {
      rejectUnauthorized: false
    }
  });

  return transporter;
}

/**
 * Sends an email using SMTP or simulated logger
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text version
 * @param {string} [options.html] - HTML body version
 * @returns {Promise<Object>} - Send result details
 */
async function sendEmail({ to, subject, text, html }) {
  const mailTransporter = getTransporter();
  const mailOptions = {
    from: SMTP_FROM,
    to,
    subject,
    text: text || (html ? html.replace(/<[^>]*>/g, '') : ''),
    html: html || (text ? text.replace(/\n/g, '<br>') : '')
  };

  if (!mailTransporter) {
    console.log('==================================================');
    console.log('[SIMULATED EMAIL DISPATCH]');
    console.log(`FROM: ${SMTP_FROM}`);
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log('--- BODY (PLAIN TEXT) ---');
    console.log(mailOptions.text.substring(0, 500));
    console.log('==================================================');
    return { simulated: true, messageId: `sim_${Date.now()}` };
  }

  try {
    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`[MAILER SUCCESS] Email sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[MAILER EXCEPTION] Failed to dispatch email to ${to}:`, error);
    throw error;
  }
}

module.exports = {
  sendEmail
};
