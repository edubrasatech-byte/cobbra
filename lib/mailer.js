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
    connectionTimeout: 8000, // 8 seconds
    greetingTimeout: 8000,    // 8 seconds
    socketTimeout: 8000,      // 8 seconds
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
  const resendApiKey = process.env.RESEND_API_KEY;
  const smtpUser = process.env.SMTP_USER || '';
  const fromEmail = resendApiKey 
    ? (process.env.RESEND_FROM || `"Cobbra" <onboarding@resend.dev>`)
    : (process.env.SMTP_FROM || `"Cobbra Suporte" <${smtpUser || 'suporte@cobbra.com.br'}>`);

  const mailOptions = {
    from: fromEmail,
    to,
    subject,
    text: text || (html ? html.replace(/<[^>]*>/g, '') : ''),
    html: html || (text ? text.replace(/\n/g, '<br>') : '')
  };

  // --- Mode 1: Resend HTTP API ---
  if (resendApiKey) {
    console.log(`[MAILER] Dispatching email via Resend API to ${to}...`);
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to,
          subject,
          html: mailOptions.html,
          text: mailOptions.text
        })
      });
      const data = await response.json();
      if (response.ok) {
        console.log(`[MAILER SUCCESS] Email sent via Resend (ID: ${data.id})`);
        return { success: true, messageId: data.id };
      } else {
        console.error(`[MAILER ERROR] Resend API returned error:`, data);
        throw new Error(data.message || 'Erro retornado pela API do Resend.');
      }
    } catch (error) {
      console.error(`[MAILER EXCEPTION] Resend API failed:`, error);
      throw error;
    }
  }

  // --- Mode 2: Nodemailer SMTP (Hostinger) ---
  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    console.log('==================================================');
    console.log('[SIMULATED EMAIL DISPATCH]');
    console.log(`FROM: ${fromEmail}`);
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log('--- BODY (PLAIN TEXT) ---');
    console.log(mailOptions.text.substring(0, 500));
    console.log('==================================================');
    return { simulated: true, messageId: `sim_${Date.now()}` };
  }

  try {
    const info = await mailTransporter.sendMail({
      from: fromEmail,
      to,
      subject,
      text: mailOptions.text,
      html: mailOptions.html
    });
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
