import { generateStaticPix } from './pix';

/**
 * COBBRA - Wrapper da API do Asaas com Fallback para Pix Estático
 */

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/v3';

/**
 * Retorna as headers padrão para chamada Asaas
 * @param {string} apiKey 
 */
function getHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    'access_token': apiKey
  };
}

/**
 * Cria ou retorna o cliente no Asaas
 * @param {Object} user 
 * @param {Object} client 
 * @returns {Promise<string|null>} - ID do cliente no Asaas ou null se falhar/sem chave
 */
export async function createAsaasCustomer(user, client) {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ ASAAS_API_KEY não definida. Operando em modo de Fallback de Pix Estático.');
    return null;
  }

  try {
    // Buscar cliente pelo CPF/CNPJ ou Email primeiro para evitar duplicados
    if (client.document) {
      const searchRes = await fetch(`${ASAAS_API_URL}/customers?cpfCnpj=${client.document.replace(/\D/g, '')}`, {
        headers: getHeaders(apiKey)
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.data && searchData.data.length > 0) {
          return searchData.data[0].id;
        }
      }
    }

    // Se não encontrou, cadastrar
    const payload = {
      name: client.name,
      email: client.email || undefined,
      phone: client.phone ? client.phone.replace(/\D/g, '') : undefined,
      cpfCnpj: client.document ? client.document.replace(/\D/g, '') : undefined,
      notificationDisabled: true, // Cobbra cuida dos lembretes via Catarina
    };

    const res = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Erro ao criar cliente no Asaas:', errorText);
      return null;
    }

    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error('❌ Exceção ao cadastrar cliente no Asaas:', error);
    return null;
  }
}

/**
 * Gera uma cobrança no Asaas
 * @param {Object} user 
 * @param {Object} charge 
 * @param {string} clientAsaasId 
 * @returns {Promise<Object>} - Dados da fatura Asaas (inclui copiaCole e qrCode se Pix)
 */
export async function createAsaasPayment(user, charge, clientAsaasId) {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey || !clientAsaasId) {
    // Modo Fallback
    console.warn('⚠️ Executando Pix Estático (Fallback) para cobrança', charge.id);
    const pixCode = generateStaticPix({
      key: user.pix_key || 'demo@cobbra.com.br',
      amount: charge.amount,
      name: user.business_name || user.name || 'Cobbra Pay',
      txid: charge.id.substring(0, 25).toUpperCase().replace(/[^A-Z0-9]/g, 'C')
    });
    return {
      fallback: true,
      paymentLink: null,
      pixCopyPaste: pixCode,
      invoiceUrl: null,
      asaasId: null
    };
  }

  try {
    const methodMap = {
      'pix': 'PIX',
      'boleto': 'BOLETO',
      'link': 'UNDEFINED'
    };

    const payload = {
      customer: clientAsaasId,
      billingType: methodMap[charge.payment_method] || 'PIX',
      value: charge.amount,
      dueDate: charge.due_date,
      description: charge.description || 'Cobrança Cobbra.ai',
      externalReference: charge.id
    };

    const res = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Falha no Asaas: ${errorText}`);
    }

    const payment = await res.json();

    // Se for PIX, puxar QR Code do Asaas
    let pixCopyPaste = null;
    if (payment.billingType === 'PIX') {
      const pixRes = await fetch(`${ASAAS_API_URL}/payments/${payment.id}/pixQrCode`, {
        headers: getHeaders(apiKey)
      });
      if (pixRes.ok) {
        const pixData = await pixRes.json();
        pixCopyPaste = pixData.payload;
      }
    }

    return {
      fallback: false,
      paymentLink: payment.invoiceUrl,
      pixCopyPaste: pixCopyPaste,
      invoiceUrl: payment.invoiceUrl,
      asaasId: payment.id
    };
  } catch (error) {
    console.error('❌ Exceção ao gerar pagamento no Asaas:', error);
    // Graceful fallback para Pix estático local
    const pixCode = generateStaticPix({
      key: user.pix_key || 'demo@cobbra.com.br',
      amount: charge.amount,
      name: user.business_name || user.name || 'Cobbra Pay',
      txid: charge.id.substring(0, 25).toUpperCase().replace(/[^A-Z0-9]/g, 'C')
    });
    return {
      fallback: true,
      paymentLink: null,
      pixCopyPaste: pixCode,
      invoiceUrl: null,
      asaasId: null
    };
  }
}
