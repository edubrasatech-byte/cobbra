'use client';
import { useState, useEffect } from 'react';

export default function LembretesPage() {
  const [reminders, setReminders] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState('history');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Daily template state
  const [dailyTemplate, setDailyTemplate] = useState(
    `Olá, {nome_cliente}! 🐍\n\nInformamos que seu contrato de faturamento diário referente a "{descricao}" registrou uma nova movimentação.\n\n* Resumo Atualizado:\n- Valor Base: R$ {valor_base}\n- Juros Pós-Vencimento: {juros_diarios}% ao dia\n- Dias em Atraso: {dias_atraso} dia(s)\n- Juros Acumulados: R$ {juros_acumulados}\n- 💰 VALOR TOTAL A PAGAR: R$ {valor_total_amanha}\n\nVocê pode efetuar pagamentos parciais (abatimentos) ou quitar o valor total a qualquer momento. Chave Pix disponível no aplicativo.\n\nAgradecemos a parceria!`
  );
  const [isEditingDaily, setIsEditingDaily] = useState(false);

  useEffect(() => {
    fetch('/api/lembretes?limit=50').then(r => r.json()).then(d => { setReminders(d.reminders || []); setLoading(false); }).catch(() => setLoading(false));
    fetch('/api/lembretes/templates').then(r => r.json()).then(d => setTemplates(d.templates || []));
  }, []);

  const statusConfig = { pending: { l: 'Pendente', c: '#f59e0b' }, sent: { l: 'Enviado', c: '#3b82f6' }, delivered: { l: 'Entregue', c: '#8b5cf6' }, read: { l: 'Lido', c: '#10b981' }, failed: { l: 'Falhou', c: '#ef4444' } };
  const toneConfig = { gentle: { l: 'Gentil 💚', c: '#10b981' }, neutral: { l: 'Neutro 📋', c: '#3b82f6' }, firm: { l: 'Firme ⚡', c: '#f59e0b' } };
  const cardS = { background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.06)' };
  const inputS = { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: 14, outline: 'none', fontFamily: 'Inter,sans-serif' };

  function handleSaveDailyTemplate() {
    setMsg('Salvando template diário...');
    setTimeout(() => {
      setIsEditingDaily(false);
      setMsg('Template diário atualizado com sucesso! 💾');
      setTimeout(() => setMsg(''), 3000);
    }, 1000);
  }

  // Simulated resolved preview
  const getDailyPreview = () => {
    return dailyTemplate
      .replace('{nome_cliente}', 'Carlos Silva')
      .replace('{descricao}', 'Hospedagem de Servidor VPS')
      .replace('{valor_base}', '150,00')
      .replace('{juros_diarios}', '0.30')
      .replace('{dias_atraso}', '5')
      .replace('{juros_acumulados}', '2,25')
      .replace('{valor_total_amanha}', '152,25');
  };

  return (
    <div>
      {msg && <div style={{ position: 'fixed', top: 80, right: 32, background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 1001, boxShadow: '0 4px 14px rgba(16,185,129,0.3)', animation: 'fadeInUp 0.3s ease' }}>{msg}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setActiveTab('history')} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'Inter', background: activeTab === 'history' ? 'linear-gradient(135deg,#059669,#0d9488)' : 'rgba(255,255,255,0.05)', color: activeTab === 'history' ? '#fff' : '#94a3b8', fontSize: 14, fontWeight: 600 }}>📋 Histórico</button>
        <button onClick={() => setActiveTab('templates')} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'Inter', background: activeTab === 'templates' ? 'linear-gradient(135deg,#059669,#0d9488)' : 'rgba(255,255,255,0.05)', color: activeTab === 'templates' ? '#fff' : '#94a3b8', fontSize: 14, fontWeight: 600 }}>✏️ Templates</button>
        <button onClick={() => setActiveTab('daily')} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'Inter', background: activeTab === 'daily' ? 'linear-gradient(135deg,#059669,#0d9488)' : 'rgba(255,255,255,0.05)', color: activeTab === 'daily' ? '#fff' : '#94a3b8', fontSize: 14, fontWeight: 600 }}>📅 Template Cobrança Diária</button>
      </div>

      {activeTab === 'history' && (
        <div style={cardS}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Lembretes enviados</h3>
          {reminders.map(r => {
            const st = statusConfig[r.status] || statusConfig.sent;
            return (
              <div key={r.id} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: r.channel === 'whatsapp' ? 'rgba(37,211,102,0.15)' : 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {r.channel === 'whatsapp' ? '📱' : '✉️'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{r.client_name}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: `${st.c}20`, color: st.c, fontWeight: 600 }}>{st.l}</span>
                    <span style={{ fontSize: 11, color: '#64748b', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.03)' }}>{r.channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{r.message}</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: '#64748b' }}>
                    <span>Enviado: {r.sent_at ? new Date(r.sent_at).toLocaleString('pt-BR') : '-'}</span>
                    {r.charge_amount && <span>Valor: R$ {Number(r.charge_amount).toFixed(2)}</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {reminders.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>{loading ? 'Carregando...' : 'Nenhum lembrete enviado ainda'}</p>}
        </div>
      )}

      {activeTab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {templates.map(t => {
            const tone = toneConfig[t.tone] || toneConfig.gentle;
            return (
              <div key={t.id} style={{ ...cardS, transition: 'all 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#059669'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{t.name}</h4>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: `${tone.c}20`, color: tone.c, fontWeight: 600 }}>{tone.l}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                  <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{t.message}</p>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b' }}>
                  <span>⏰ {t.timing_days < 0 ? `${Math.abs(t.timing_days)} dias antes` : t.timing_days === 0 ? 'No dia' : `${t.timing_days} dias após`}</span>
                  <span>📨 {t.channel === 'both' ? 'WhatsApp + Email' : t.channel}</span>
                  {t.is_default ? <span style={{ color: '#10b981' }}>✓ Padrão</span> : null}
                </div>
              </div>
            );
          })}
          {templates.length === 0 && <p style={{ gridColumn: '1/-1', color: '#64748b', textAlign: 'center', padding: 60 }}>Nenhum template encontrado</p>}
        </div>
      )}

      {activeTab === 'daily' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
          {/* Template Editor */}
          <div style={cardS}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>⚙️ Editor de Lembrete Diário</h3>
              <button 
                onClick={() => {
                  if (isEditingDaily) handleSaveDailyTemplate();
                  else setIsEditingDaily(true);
                }} 
                style={{ padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg,#059669,#0d9488)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter' }}
              >
                {isEditingDaily ? '💾 Salvar Template' : '✏️ Editar'}
              </button>
            </div>

            {/* Variable Helpers */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 8 }}>Variáveis dinâmicas suportadas (clique para copiar / usar):</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { tag: '{nome_cliente}', desc: 'Nome' },
                  { tag: '{descricao}', desc: 'Descrição' },
                  { tag: '{valor_base}', desc: 'Valor Base' },
                  { tag: '{juros_diarios}', desc: 'Juros Diários' },
                  { tag: '{dias_atraso}', desc: 'Dias em Atraso' },
                  { tag: '{juros_acumulados}', desc: 'Juros Acumulados' },
                  { tag: '{valor_total_amanha}', desc: 'Valor Total' }
                ].map(v => (
                  <span 
                    key={v.tag}
                    onClick={() => {
                      if (isEditingDaily) {
                        setDailyTemplate(prev => prev + ' ' + v.tag);
                      }
                    }}
                    style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#10b981', cursor: isEditingDaily ? 'pointer' : 'default', fontWeight: 600 }}
                  >
                    {v.tag}
                  </span>
                ))}
              </div>
            </div>

            <textarea 
              value={dailyTemplate} 
              onChange={e => setDailyTemplate(e.target.value)} 
              disabled={!isEditingDaily}
              rows={14}
              style={{ 
                ...inputS, 
                height: 'auto', 
                resize: 'none', 
                fontSize: 13, 
                lineHeight: 1.6, 
                borderColor: isEditingDaily ? '#059669' : 'rgba(255,255,255,0.15)',
                background: isEditingDaily ? 'rgba(5,150,105,0.02)' : 'rgba(255,255,255,0.03)'
              }}
            />
          </div>

          {/* Real-time Preview */}
          <div style={{ ...cardS, background: 'rgba(5,150,105,0.02)', borderColor: 'rgba(5,150,105,0.1)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#10b981', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>👁️</span> Visualização da Mensagem (WhatsApp)
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Esta é uma demonstração de como a mensagem é enviada ao WhatsApp do cliente.</p>

            <div style={{ background: '#0b141a', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              {/* WhatsApp Header */}
              <div style={{ background: '#202c33', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🐍</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#e9edef', margin: 0 }}>Assistente Cobbra 🐍</p>
                  <p style={{ fontSize: 10, color: '#8696a0', margin: 0 }}>online</p>
                </div>
              </div>

              {/* WhatsApp Chat Body */}
              <div style={{ 
                backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', 
                backgroundSize: 'contain',
                padding: '20px 16px',
                minHeight: 280
              }}>
                {/* Text Bubble */}
                <div style={{ 
                  background: '#005c4b', 
                  borderRadius: '12px 12px 0 12px', 
                  padding: '12px 14px', 
                  maxWidth: '85%', 
                  marginLeft: 'auto',
                  border: '1px solid rgba(255,255,255,0.03)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}>
                  <p style={{ fontSize: 12.5, color: '#e9edef', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif' }}>
                    {getDailyPreview()}
                  </p>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textAlign: 'right', margin: '4px 0 0 0' }}>10:30 ✓✓</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
