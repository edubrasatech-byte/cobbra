import { getUserFromRequest } from '@/lib/auth';
import { run, generateId } from '@/lib/db';

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Não autorizado. Faça login novamente.' }, { status: 401 });
    }

    const { business_name, business_niche, collection_rigor, pix_key, pix_key_type } = await request.json();

    if (!business_name || !business_niche || !pix_key) {
      return Response.json({ error: 'Nome da empresa, nicho e chave Pix são obrigatórios.' }, { status: 400 });
    }

    // Update user profile and complete onboarding
    run(
      `UPDATE users 
       SET business_name = ?, business_niche = ?, collection_rigor = ?, pix_key = ?, pix_key_type = ?, onboarding_completed = 1, updated_at = datetime('now')
       WHERE id = ?`,
      [business_name, business_niche, collection_rigor || 'neutral', pix_key, pix_key_type || 'email', user.id]
    );

    // Clean up any old templates for this user to avoid duplications
    run('DELETE FROM reminder_templates WHERE user_id = ?', [user.id]);

    // Dynamic specialized template generators
    const templatesToSeed = [];

    if (business_niche === 'locacao_veiculos') {
      // 🚗 Car Rental Specialized Templates
      templatesToSeed.push(
        {
          name: 'Lembrete de Locação - 3 dias antes',
          message: 'Oi {cliente_nome}! 🚗 Passando para lembrar que o aluguel do veículo *{vehicle_info}* ({valor}) vence em 3 dias ({vencimento}). Pode pagar pelo Pix no link: {link_pagamento}. Obrigado! 🙏',
          tone: 'gentle',
          days: -3
        },
        {
          name: 'Lembrete de Locação - No dia',
          message: 'Oi {cliente_nome}! 🚗 Hoje é o dia de vencimento da diária de locação do veículo *{vehicle_info}* ({valor}). Segue o link Pix para pagamento/renovação do contrato: {link_pagamento}. Qualquer dúvida, fale conosco! 😊',
          tone: 'gentle',
          days: 0
        },
        {
          name: 'Alerta de Atraso e Devolução - 1 dia após',
          message: 'Olá, {cliente_nome}! 🚗 Lembramos que o aluguel do veículo *{vehicle_info}* ({valor}) está vencido desde ontem ({vencimento}). Por favor, regularize para evitar diárias adicionais ou multas. Link Pix: {link_pagamento}',
          tone: 'neutral',
          days: 1
        },
        {
          name: 'Notificação Estrita de Devolução - 5 dias após',
          message: 'Prezado {cliente_nome}. ALERTA URGENTE ⚠️: A diária de locação do veículo *${vehicle_info}* está vencida há 5 dias. Pedimos a quitação imediata Pix no link {link_pagamento} ou comparecimento imediato para devolução do veículo.',
          tone: 'firm',
          days: 5
        }
      );
    } else if (business_niche === 'emprestimo') {
      // 💰 Loans and Structured Finance Templates
      templatesToSeed.push(
        {
          name: 'Aviso de Parcela - 3 dias antes',
          message: 'Olá {cliente_nome}. Lembrete de vencimento: sua parcela de empréstimo no valor de {valor} vence em 3 dias ({vencimento}). Copie o Pix no link para pagamento: {link_pagamento}',
          tone: 'neutral',
          days: -3
        },
        {
          name: 'Aviso de Vencimento - No dia',
          message: 'Atenção {cliente_nome}! Hoje vence sua parcela de empréstimo no valor de {valor}. O não pagamento hoje gerará incidência de multa contratual e juros diários adicionais. Efetue o Pix no link: {link_pagamento}',
          tone: 'firm',
          days: 0
        },
        {
          name: 'Cobrança Rígida - 3 dias após',
          message: 'URGENTE {cliente_nome} ⚡: Sua parcela de empréstimo de {valor} está vencida há 3 dias (vencimento: {vencimento}). Os juros diários contratuais estão acumulando. Evite protesto e negativação pagando agora no Pix: {link_pagamento}',
          tone: 'firm',
          days: 3
        }
      );
    } else if (business_niche === 'clinica') {
      // 🩺 Health/Medical diplomatique templates
      templatesToSeed.push(
        {
          name: 'Confirmação de Consulta - 3 dias antes',
          message: 'Olá, {cliente_nome}! 🩺 Passando para lembrar que sua consulta/sessão está confirmada para daqui a 3 dias ({vencimento}). O valor do acerto é {valor}. Se quiser antecipar via Pix: {link_pagamento}. Qualquer dúvida, estamos aqui! 🌸',
          tone: 'gentle',
          days: -3
        },
        {
          name: 'Lembrete de Acerto - No dia',
          message: 'Olá, {cliente_nome}! 🩺 Lembramos gentilmente do acerto de sua sessão agendada para hoje ({valor}). Segue o Pix para facilitação do seu dia: {link_pagamento}. Agradecemos o carinho! 💚',
          tone: 'gentle',
          days: 0
        },
        {
          name: 'Lembrete Diplomático - 3 dias após',
          message: 'Oi {cliente_nome}! Passando para saber se deu tudo certo? 🌸 Ficou pendente o acerto da sessão do dia {vencimento} ({valor}). Segue o Pix quando puder regularizar: {link_pagamento}. Muito obrigado! 💚',
          tone: 'gentle',
          days: 3
        }
      );
    } else if (business_niche === 'personal') {
      // 🏋️‍♂️ Personal Trainer motivational templates
      templatesToSeed.push(
        {
          name: 'Lembrete de Mensalidade - 3 dias antes',
          message: 'E aí, {cliente_nome}! 💪 Passando para lembrar que a mensalidade do seu plano de treinos ({valor}) vence em 3 dias. Bora manter o foco! Segue o link Pix para renovar: {link_pagamento}',
          tone: 'gentle',
          days: -3
        },
        {
          name: 'Dia do Treino e Acerto - No dia',
          message: 'Fala {cliente_nome}! 🏋️‍♂️ Hoje é o vencimento da sua mensalidade ({valor}). Vamos garantir as aulas ativas e o progresso firme? Segue o Pix de pagamento: {link_pagamento}. Tmj! 💪',
          tone: 'gentle',
          days: 0
        },
        {
          name: 'Treinos Pendentes - 3 dias após',
          message: 'E aí {cliente_nome}! 🔋 Notei que a mensalidade de treinos do dia {vencimento} está pendente. Vamos regularizar para não quebrar o ritmo das aulas? Pix rápido aqui: {link_pagamento}',
          tone: 'neutral',
          days: 3
        }
      );
    } else {
      // 💼 Standard Niche / General templates tailored to selected rigor
      const isGentle = collection_rigor === 'gentle';
      const isFirm = collection_rigor === 'firm';

      templatesToSeed.push(
        {
          name: 'Aviso Gentil - 3 dias antes',
          message: isGentle 
            ? 'Oi {cliente_nome}! 💚 Lembrete gentil: sua {descricao} no valor de {valor} vence em 3 dias ({vencimento}). Pode pagar pelo Pix no link: {link_pagamento}. Obrigado! 🙏'
            : 'Olá {cliente_nome}. Lembramos que sua {descricao} no valor de {valor} vence em 3 dias ({vencimento}). Link Pix para pagamento: {link_pagamento}',
          tone: isGentle ? 'gentle' : 'neutral',
          days: -3
        },
        {
          name: 'Lembrete de Vencimento - No dia',
          message: isFirm
            ? 'Atenção {cliente_nome}! Hoje é o dia de vencimento de {descricao} ({valor}). Por favor, efetue o pagamento Pix no link para evitar acréscimo de juros: {link_pagamento}'
            : 'Oi {cliente_nome}! 💚 Hoje vence sua {descricao} ({valor}). Segue o link Pix para facilitação do seu pagamento: {link_pagamento}. Qualquer dúvida, estou aqui! 😊',
          tone: isFirm ? 'firm' : 'gentle',
          days: 0
        },
        {
          name: 'Aviso de Atraso - 3 dias após',
          message: isFirm
            ? '{cliente_nome}, informamos que sua cobrança de {descricao} ({valor}) está pendente desde {vencimento}. Pedimos a regularização imediata no Pix {link_pagamento} para evitar juros contratuais.'
            : 'Oi {cliente_nome}! 💚 Passando para lembrar que sua {descricao} de {valor} venceu há 3 dias. Tudo bem? Segue o link: {link_pagamento}. Me avise se precisar de algo!',
          tone: isFirm ? 'firm' : 'neutral',
          days: 3
        }
      );
    }

    // Insert templates into sqlite database
    for (const t of templatesToSeed) {
      run(
        `INSERT INTO reminder_templates (id, user_id, name, message, tone, timing_days, is_default, channel)
         VALUES (?, ?, ?, ?, ?, ?, 1, 'both')`,
        [generateId(), user.id, t.name, t.message, t.tone, t.days]
      );
    }

    // Log Activity
    run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, 'user', ?, ?)`,
      [generateId(), user.id, 'onboarding_completed', user.id, `Onboarding concluído com sucesso. Nicho selecionado: ${business_niche}, rigor: ${collection_rigor}.`]
    );

    // Seed default first notification
    run(
      `INSERT INTO notifications (id, user_id, type, title, message)
       VALUES (?, ?, 'success', '🚀 Onboarding Concluído!', 'Seja bem-vindo ao seu painel Cobbra segmentado. A Catarina AI foi configurada com sucesso para o seu nicho!')`,
      [generateId(), user.id]
    );

    return Response.json({ success: true, message: 'Onboarding concluído com sucesso!' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
