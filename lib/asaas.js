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

/**
 * Solicita uma transferência bancária (TED ou Pix) via Asaas
 * @param {number} value
 * @param {string} pixKey
 * @param {string} pixKeyType
 * @returns {Promise<Object>}
 */
export async function requestAsaasTransfer(value, pixKey, pixKeyType) {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ ASAAS_API_KEY não definida. Simulando transferência Pix de saque.');
    return {
      success: true,
      transferId: 'SIMULATED-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      simulated: true
    };
  }

  try {
    // Map standard pix key types to Asaas expectations
    const typeMap = {
      'email': 'EMAIL',
      'cpf': 'CPF',
      'cnpj': 'CNPJ',
      'telefone': 'PHONE',
      'phone': 'PHONE',
      'evp': 'EVP',
      'chave_aleatoria': 'EVP'
    };

    const mappedType = typeMap[String(pixKeyType).toLowerCase()] || 'EVP';

    const payload = {
      value: parseFloat(value.toFixed(2)),
      pixAddressKey: pixKey,
      pixAddressKeyType: mappedType,
      description: 'Saque Cobbra Pay'
    };

    const res = await fetch(`${ASAAS_API_URL}/transfers`, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erro Asaas Transfer: ${errorText}`);
    }

    const data = await res.json();
    return {
      success: true,
      transferId: data.id,
      simulated: false
    };
  } catch (error) {
    console.error('❌ Exceção ao solicitar transferência no Asaas:', error);
    throw error;
  }
}

/**
 * Solicita o estorno/reembolso de uma cobrança paga via Asaas
 * @param {string} paymentId - ID do pagamento no Asaas (asaas_id)
 * @param {number} [amount] - Valor opcional do estorno parcial. Se omitido, estorna o valor total.
 * @returns {Promise<Object>}
 */
export async function refundAsaasPayment(paymentId, amount) {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey || !paymentId) {
    console.warn('⚠️ ASAAS_API_KEY ou paymentId não definidos. Simulando estorno Asaas.');
    return {
      success: true,
      simulated: true,
      refundId: 'SIMULATED-REFUND-' + Math.random().toString(36).substring(2, 11).toUpperCase()
    };
  }

  try {
    const payload = amount ? { value: parseFloat(Number(amount).toFixed(2)) } : {};
    const res = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erro Asaas Refund: ${errorText}`);
    }

    const data = await res.json();
    return {
      success: true,
      refundId: data.id,
      simulated: false,
      data
    };
  } catch (error) {
    console.error('❌ Exceção ao reembolsar pagamento no Asaas:', error);
    throw error;
  }
}

/**
 * Atualiza uma cobrança pendente no Asaas
 * @param {Object} user 
 * @param {string} asaasId 
 * @param {number} value 
 * @param {string} dueDate 
 * @param {string} description 
 * @returns {Promise<Object>}
 */
export async function updateAsaasPayment(user, asaasId, value, dueDate, description) {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey || !asaasId) {
    return { fallback: true };
  }

  try {
    const payload = {
      value: parseFloat(value.toFixed(2)),
      dueDate,
      description
    };

    const res = await fetch(`${ASAAS_API_URL}/payments/${asaasId}`, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Falha ao atualizar cobrança no Asaas: ${errorText}`);
    }

    const payment = await res.json();
    
    // Se for PIX, re-puxar QR Code
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
    console.error('❌ Exceção ao atualizar pagamento no Asaas:', error);
    return { fallback: true };
  }
}


