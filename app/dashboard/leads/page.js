'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProspectingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // Form states
  const [niche, setNiche] = useState('personal trainer');
  const [city, setCity] = useState('Curitiba');
  
  // Custom Keys (from localStorage)
  const [customGroqKey, setCustomGroqKey] = useState('');
  const [customSerpKey, setCustomSerpKey] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  // Extraction States
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [leads, setLeads] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Load User Auth and Saved Keys on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user && (data.user.role === 'admin' || data.user.role === 'admin_senior')) {
          setUser(data.user);
          setAuthorized(true);
        } else {
          router.push('/dashboard');
        }
        setAuthLoading(false);
      })
      .catch(() => {
        router.push('/login');
        setAuthLoading(false);
      });

    // Load custom keys from localStorage
    setCustomGroqKey(localStorage.getItem('cobbra_custom_groq_key') || '');
    setCustomSerpKey(localStorage.getItem('cobbra_custom_serp_key') || '');
  }, [router]);

  // Handle key saves to localStorage
  const handleSaveKeys = () => {
    localStorage.setItem('cobbra_custom_groq_key', customGroqKey);
    localStorage.setItem('cobbra_custom_serp_key', customSerpKey);
    showToast('Chaves salvas localmente no navegador! 🔑', 'success');
  };

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  // Automated progress bar simulation during API calls
  useEffect(() => {
    let interval;
    if (loading) {
      setProgressStep(1);
      interval = setInterval(() => {
        setProgressStep(prev => {
          if (prev === 1) return 2;
          if (prev === 2) return 3;
          return 3;
        });
      }, 2200);
    } else {
      setProgressStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!niche || !city) return;

    setLoading(true);
    setLeads([]);
    setSelectedLeads([]);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/ai/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche,
          city,
          customGroqKey: customGroqKey.trim() || undefined,
          customSerpKey: customSerpKey.trim() || undefined
        })
      });

      const data = await response.json();
      if (response.ok) {
        setLeads(data.leads || []);
        if (data.leads && data.leads.length > 0) {
          showToast(`Catarina extraiu ${data.leads.length} leads de autônomos com sucesso! 🐍🎉`, 'success');
        } else {
          showToast(data.message || 'Nenhum lead de autônomo com contato foi indexado para esta busca.', 'info');
        }
      } else {
        showToast(data.error || 'Erro ao realizar a prospecção.', 'error');
      }
    } catch (error) {
      showToast('Erro crítico de conexão com o servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeads([...leads]);
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (lead) => {
    const isSelected = selectedLeads.some(l => l.phone === lead.phone && l.name === lead.name);
    if (isSelected) {
      setSelectedLeads(selectedLeads.filter(l => !(l.phone === lead.phone && l.name === lead.name)));
    } else {
      setSelectedLeads([...selectedLeads, lead]);
    }
  };

  const handleImport = async () => {
    if (selectedLeads.length === 0) return;

    setLoading(true);
    setMessage({ text: 'Importando contatos para o banco SQLite...', type: 'info' });

    try {
      const response = await fetch('/api/ai/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          leads: selectedLeads
        })
      });

      const data = await response.json();
      if (response.ok) {
        showToast(`Sucesso! ${data.count} autônomos foram cadastrados como seus Clientes. 💚`, 'success');
        setSelectedLeads([]);
        // Redirect to Clientes tab after a brief delay
        setTimeout(() => {
          router.push('/dashboard/clientes');
        }, 2200);
      } else {
        showToast(data.error || 'Erro ao importar leads.', 'error');
      }
    } catch (error) {
      showToast('Erro de rede ao efetuar a importação.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070913]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
          <p className="text-secondary-theme text-xs font-bold uppercase tracking-widest">Validando Autenticação...</p>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  const cardStyle = {
    background: 'var(--bg-surface)',
    borderRadius: '24px',
    border: '1px solid var(--border-color)',
    padding: '24px'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    background: '#020617',
    color: '#f8fafc',
    fontSize: '13.5px',
    outline: 'none',
    fontFamily: 'Inter, sans-serif'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
      {/* Toast Notification */}
      {message.text && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 80, 
            right: 32, 
            background: message.type === 'error' ? '#ef4444' : message.type === 'info' ? '#3b82f6' : '#10b981', 
            color: 'var(--text-primary)', 
            padding: '14px 28px', 
            borderRadius: '12px', 
            fontSize: '14px', 
            fontWeight: 600, 
            zIndex: 1001, 
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)', 
            transition: 'all 0.3s ease' 
          }}
        >
          {message.text}
        </div>
      )}

      {/* Header Widget banner */}
      <div className="mb-8" style={{ ...cardStyle, background: 'linear-gradient(135deg, rgba(5,150,105,0.05) 0%, rgba(13,148,136,0.02) 100%)', borderColor: 'rgba(5,150,105,0.15)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>🔍</span> Radar de Prospecção Ativa (P2P)
            </h2>
            <p className="text-secondary-theme text-xs md:text-sm mt-2 max-w-2xl leading-relaxed">
              Encontre profissionais liberais e prestadores de serviços autônomos de verdade direto das redes sociais, sem bloqueios de CAPTCHA, estruturados e formatados em E.164 pela inteligência artificial da Catarina Groq AI.
            </p>
          </div>
          <div className="flex-shrink-0 bg-emerald-500/10 border border-emerald-500/25 px-4 py-2 rounded-xl">
            <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">Apenas Administradores 🛡️</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Search Panel Card */}
        <div className="lg:col-span-2" style={cardStyle}>
          <h3 className="text-base font-bold text-slate-100 mb-6 flex items-center gap-2">
            <span>⚡</span> Configurar Captação
          </h3>

          <form onSubmit={handleSearch} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-secondary-theme block mb-2">Nicho do Autônomo:</label>
                <input 
                  type="text"
                  placeholder="Ex: personal trainer, diarista, marceneiro"
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  style={inputStyle}
                  disabled={loading}
                  required
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['personal trainer', 'marceneiro', 'aluguel de andaime', 'motorista particular'].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNiche(n)}
                      className="text-[10px] px-2 py-1 bg-card-theme hover:bg-emerald-500/10 border border-theme hover:border-emerald-500/30 rounded text-secondary-theme hover:text-emerald-400 transition-colors"
                      disabled={loading}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-secondary-theme block mb-2">Cidade:</label>
                <input 
                  type="text"
                  placeholder="Ex: Curitiba, São Paulo"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  style={inputStyle}
                  disabled={loading}
                  required
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Curitiba', 'São Paulo', 'Rio de Janeiro', 'Florianópolis'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCity(c)}
                      className="text-[10px] px-2 py-1 bg-card-theme hover:bg-emerald-500/10 border border-theme hover:border-emerald-500/30 rounded text-secondary-theme hover:text-emerald-400 transition-colors"
                      disabled={loading}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="text-xs font-medium text-secondary-theme hover:text-primary-theme flex items-center gap-1.5 cursor-pointer"
              >
                <span>{showConfig ? '⚙️ Ocultar' : '⚙️ Chaves de Contingência'}</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-98 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Executando...</span>
                  </>
                ) : (
                  <>
                    <span>🔍 Procurar Leads com Groq AI</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* API contingency Panel */}
        <div style={cardStyle}>
          <h3 className="text-base font-bold text-slate-100 mb-6 flex items-center gap-2">
            <span>🛡️</span> Resiliência de API
          </h3>
          <p className="text-secondary-theme text-xs leading-relaxed mb-4">
            O site já possui chaves de API configuradas no servidor de produção. Porém, caso queira utilizar limites próprios do SerpAPI ou Groq, preencha-os abaixo.
          </p>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full py-3 rounded-xl bg-input-theme border border-theme text-secondary-theme font-bold text-xs uppercase tracking-wide hover:bg-surface-theme transition-colors"
          >
            {showConfig ? 'Ocultar Configuração' : 'Configurar Chaves Locais'}
          </button>
        </div>
      </div>

      {/* Contingency keys block (expanded if showConfig) */}
      {showConfig && (
        <div className="mb-8" style={cardStyle}>
          <h4 className="text-xs uppercase font-extrabold tracking-wider text-emerald-400 mb-4">🔑 Chaves de Contingência (Persistidas no Navegador)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[11px] font-semibold text-secondary-theme block mb-1.5">Groq API Key Customizada:</label>
              <input
                type="password"
                placeholder="gsk_..."
                value={customGroqKey}
                onChange={e => setCustomGroqKey(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-secondary-theme block mb-1.5">SerpAPI Key Customizada:</label>
              <input
                type="password"
                placeholder="Cole sua SerpAPI Key se preferir..."
                value={customSerpKey}
                onChange={e => setCustomSerpKey(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <button
            onClick={handleSaveKeys}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg text-emerald-400 text-xs font-bold cursor-pointer transition-all"
          >
            Salvar Chaves Locais
          </button>
        </div>
      )}

      {/* Pipeline Loader Simulation */}
      {loading && progressStep > 0 && (
        <div className="mb-8 p-6 flex flex-col items-center justify-center" style={cardStyle}>
          <div className="w-16 h-16 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin mb-6"></div>
          <h4 className="text-slate-100 text-sm font-bold mb-2">Processamento Ativo da Prospecção</h4>
          
          <div className="space-y-3 w-full max-w-md mt-2">
            {[
              { step: 1, label: '🔍 Consultando SerpAPI rotacionando proxies contra captchas...' },
              { step: 2, label: '🧠 Lendo snippets com Groq Llama-3.3-70B e filtrando autônomos...' },
              { step: 3, label: '✨ Higienizando e-mails e formatando WhatsApp no padrão E.164...' }
            ].map(item => (
              <div key={item.step} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  progressStep > item.step 
                    ? 'bg-emerald-500 text-white' 
                    : progressStep === item.step 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500 animate-pulse' 
                      : 'bg-input-theme text-slate-600 border border-theme'
                }`}>
                  {progressStep > item.step ? '✓' : item.step}
                </div>
                <span className={`text-xs ${progressStep === item.step ? 'text-emerald-400 font-semibold' : progressStep > item.step ? 'text-secondary-theme' : 'text-muted-theme'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leads Table Container */}
      {!loading && leads.length > 0 && (
        <div style={cardStyle}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-white">📋 Autônomos Extraídos</h3>
              <p className="text-secondary-theme text-xs mt-1">Marque os autônomos que você deseja importar como novos clientes ativos no Cobbra.</p>
            </div>
            
            <button
              onClick={handleImport}
              disabled={selectedLeads.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-98 disabled:opacity-40 transition-all"
            >
              <span>📥 Importar Selecionados ({selectedLeads.length})</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-theme">
                  <th className="py-4 px-3 w-10">
                    <input 
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedLeads.length === leads.length}
                      className="cursor-pointer accent-emerald-500 w-4 h-4"
                    />
                  </th>
                  <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-secondary-theme">Profissional</th>
                  <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-secondary-theme">WhatsApp</th>
                  <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-secondary-theme">Nicho / Cidade</th>
                  <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-secondary-theme">Oferta & Condições</th>
                  <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-secondary-theme text-right">Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {leads.map((lead, idx) => {
                  const isSelected = selectedLeads.some(l => l.phone === lead.phone && l.name === lead.name);
                  return (
                    <tr 
                      key={idx}
                      className={`hover:bg-surface-theme transition-colors ${isSelected ? 'bg-emerald-500/5' : ''}`}
                    >
                      <td className="py-4 px-3">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectLead(lead)}
                          className="cursor-pointer accent-emerald-500 w-4 h-4"
                        />
                      </td>
                      <td className="py-4 px-4 font-medium text-primary-theme">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                            {lead.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-primary-theme">{lead.name}</p>
                            {lead.email && <span className="text-[10px] text-muted-theme font-semibold">{lead.email}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                            {lead.phone}
                          </span>
                          <a 
                            href={`https://wa.me/${lead.phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-5 h-5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center text-[10px]"
                            title="Conversar no WhatsApp"
                          >
                            💬
                          </a>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs">
                        <p className="text-secondary-theme font-semibold capitalize">{lead.niche}</p>
                        <p className="text-muted-theme text-[10px] mt-0.5">{lead.location}</p>
                      </td>
                      <td className="py-4 px-4 text-xs max-w-xs">
                        <div className="bg-input-theme border border-theme rounded-lg p-2.5">
                          <p className="text-secondary-theme leading-relaxed text-[11px]">{lead.offer_details}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs text-right">
                        {lead.facebook_url !== 'Não encontrado' ? (
                          <a 
                            href={lead.facebook_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-extrabold text-blue-400 hover:text-blue-300 underline"
                          >
                            Ver Publicação 🔗
                          </a>
                        ) : (
                          <span className="text-slate-600 text-xs">Facebook</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
