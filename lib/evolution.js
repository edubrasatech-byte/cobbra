/**
 * COBBRA — Evolution API Integration Module
 * Centralizes all Evolution API helpers to avoid code duplication.
 * Used by: /api/whatsapp/connect, /api/cron/send-reminders, /api/cron/process-whatsapp-queue
 */

/**
 * Resolves the Evolution API base URL from environment variables.
 * @returns {{ baseUrl: string, globalToken: string } | null}
 */
export function getEvolutionConfig() {
  const evoUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL;
  const evoToken = process.env.EVOLUTION_API_GLOBAL_TOKEN || process.env.EVOLUTION_API_TOKEN || process.env.EVOLUTION_API_GLOBAL_API_KEY || process.env.EVOLUTION_API_KEY;

  if (!evoUrl || !evoToken) return null;

  const baseUrl = evoUrl.endsWith('/') ? evoUrl.slice(0, -1) : evoUrl;
  return { baseUrl, globalToken: evoToken };
}

/**
 * Self-healing fetch wrapper that automatically retries on port 80 if port 8080 fails.
 * This handles common VPS firewall/outbound block scenarios in Brazilian hosting providers.
 * @param {string} url - The full URL to fetch
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function resilientFetch(url, options = {}) {
  try {
    return await fetch(url, options);
  } catch (e) {
    if (url.includes(':8080')) {
      const fallbackUrl = url.replace(':8080', '');
      console.log(`[EVOLUTION SELF-HEALING]: Port 8080 failed. Retrying on port 80: ${fallbackUrl}`);
      return await fetch(fallbackUrl, options);
    }
    throw e;
  }
}

/**
 * Dynamically resolves the instance-specific token using the global API token.
 * The Evolution API assigns unique tokens per instance. This function fetches
 * all instances and finds the matching one by name.
 * 
 * @param {string} baseUrl - Evolution API base URL (e.g. https://vps.example.com:8080)
 * @param {string} globalToken - Global API key for the Evolution API
 * @param {string} instanceName - The instance name to resolve (e.g. 'cobroo-session')
 * @returns {Promise<string|null>} The instance-specific token, or null if not found
 */
export async function getInstanceToken(baseUrl, globalToken, instanceName) {
  try {
    const res = await resilientFetch(`${baseUrl}/instance/fetchInstances`, {
      headers: { 'apikey': globalToken }
    });

    if (res && res.ok) {
      const instances = await res.json();
      if (Array.isArray(instances)) {
        const inst = instances.find(i => i.name === instanceName || i.instanceName === instanceName);
        if (inst && inst.token) {
          console.log(`[TOKEN RESOLVER] Dynamically resolved token for instance ${instanceName}`);
          return inst.token;
        }
      }
    }
  } catch (e) {
    console.error('[TOKEN RESOLVER ERROR]', e);
  }
  return null;
}

/**
 * Sends a WhatsApp text message through the Evolution API with self-healing port fallback.
 * 
 * @param {Object} options
 * @param {string} options.baseUrl - Evolution API base URL
 * @param {string} options.token - Instance-specific or global token
 * @param {string} options.instanceName - The instance name (e.g. 'cobroo-session')
 * @param {string} options.phone - Full phone number with country code (e.g. '5511999999999')
 * @param {string} options.text - Message text to send
 * @param {number} [options.delay=1200] - Delay in ms to simulate typing (anti-spam)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function sendWhatsAppMessage({ baseUrl, token, instanceName, phone, text, delay = 1200 }) {
  try {
    const response = await resilientFetch(`${baseUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': token
      },
      body: JSON.stringify({
        number: phone,
        text,
        delay
      })
    });

    if (response && response.ok) {
      return { success: true };
    } else {
      const errorText = await response?.text?.() || 'Unknown error';
      console.error(`[EVOLUTION SEND ERROR] ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (e) {
    console.error('[EVOLUTION SEND EXCEPTION]', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Normalizes Brazilian phone numbers for WhatsApp JID routing.
 * Accounts for the 9th digit rule in WhatsApp: JIDs for DDD > 28 do not have the 9th digit.
 * 
 * @param {string} phone - Input phone number
 * @returns {string} Normalized WhatsApp number with 55 country code
 */
export function normalizeBrazilianNumber(phone) {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  
  if (clean.startsWith('55') && clean.length >= 12) {
    clean = clean.substring(2);
  }
  
  if (clean.length === 11 && clean[2] === '9') {
    const ddd = parseInt(clean.substring(0, 2), 10);
    if (ddd > 28) {
      // Remove the 9th digit (first digit of the local number)
      clean = clean.substring(0, 2) + clean.substring(3);
    }
  }
  
  return `55${clean}`;
}

