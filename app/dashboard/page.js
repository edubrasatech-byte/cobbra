"use client";
import { useState, useEffect } from "react";

function StatCard({ icon, label, value, subValue, subLabel, color, bg }) {
  let svgIcon = icon;
  if (icon === "money") {
    svgIcon = (
      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  } else if (icon === "time") {
    svgIcon = (
      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  } else if (icon === "chart") {
    svgIcon = (
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
      </svg>
    );
  }
  return (
    <div className="bg-card-theme border border-theme rounded-xl p-3 transition-all duration-200 hover:border-emerald-500/30 group flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
        {svgIcon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold text-muted-theme uppercase tracking-widest leading-none">{label}</p>
        <p className="text-base font-black text-primary-theme tracking-tight group-hover:text-emerald-400 transition-colors leading-tight mt-0.5">{value}</p>
      </div>
      <div className="text-right flex-shrink-0">
        {subValue && (
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${bg} ${color}`}>
            {subValue}
          </span>
        )}
        {subLabel && (
          <p className="text-[8px] text-muted-theme mt-0.5 font-medium max-w-[100px] truncate hidden md:block">{subLabel}</p>
        )}
      </div>
    </div>
  );
}

function AreaChart({ data, onSelectPoint, selectedIndex }) {
  if (!data || data.length === 0) return null;
  
  const width = 500;
  const height = 150;
  const paddingX = 24;
  const paddingY = 24;
  
  const maxVal = Math.max(...data.map(d => d.total), 1);
  const minVal = 0;
  
  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((d.total - minVal) / (maxVal - minVal)) * (height - 2 * paddingY);
    return { x, y, data: d, index: i };
  });
  
  const linePath = points.reduce((acc, p, i) => {
    return acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
  }, "");
  
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : "";

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(128,128,128,0.05)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="rgba(128,128,128,0.05)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(128,128,128,0.1)" strokeWidth="1" />

        {/* Area fill */}
        {areaPath && (
          <path d={areaPath} fill="url(#areaGradient)" className="transition-all duration-300" />
        )}

        {/* Path line */}
        {linePath && (
          <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />
        )}

        {/* Interactive helper line */}
        {selectedIndex !== null && points[selectedIndex] && (
          <line
            x1={points[selectedIndex].x}
            y1={paddingY}
            x2={points[selectedIndex].x}
            y2={height - paddingY}
            stroke="rgba(16,185,129,0.2)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}

        {/* Interactive points */}
        {points.map((p, i) => {
          const isSelected = selectedIndex === i;
          return (
            <g key={i} className="cursor-pointer" onClick={() => onSelectPoint(i)}>
              <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
              {isSelected && (
                <circle cx={p.x} cy={p.y} r="7" fill="#10b981" fillOpacity="0.2" className="animate-ping" />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={isSelected ? "4.5" : "var(--bg-base)"}
                stroke={isSelected ? "#ffffff" : "#10b981"}
                strokeWidth={isSelected ? "2" : "1.5"}
                className="transition-all duration-200 hover:scale-150 origin-center"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DonutChart({ data, totalToReceive }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const colors = { paid: "#10b981", pending: "#f59e0b", reminder_sent: "#3b82f6", overdue: "#ef4444" };
  const labels = { paid: "Pago", pending: "Pendente", reminder_sent: "Lembrete", overdue: "Vencido" };
  const fmt = v => `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  let cumulative = 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-6 flex-wrap md:flex-nowrap justify-between">
        <div className="relative w-[100px] h-[100px] flex-shrink-0 flex items-center justify-center">
          <svg width="100" height="100" viewBox="0 0 36 36" className="transform -rotate-90 w-full h-full">
            <circle cx="18" cy="18" r="15.5" fill="transparent" stroke="var(--border-color)" strokeWidth="3" />
            {data.map((d, i) => {
              const pct = total > 0 ? (d.count / total) * 100 : 0;
              const offset = 100 - cumulative;
              cumulative += pct;
              return (
                <circle 
                  key={i} 
                  cx="18" 
                  cy="18" 
                  r="15.5" 
                  fill="transparent" 
                  stroke={colors[d.status] || "#64748b"} 
                  strokeWidth="3.2"
                  strokeDasharray={`${pct} ${100 - pct}`} 
                  strokeDashoffset={offset} 
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-xl font-bold text-primary-theme">{total}</span>
            <span className="text-[9px] text-muted-theme font-semibold uppercase tracking-wider mt-0.5">Total</span>
          </div>
        </div>
        
        <div className="flex-1 min-w-[120px] space-y-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-0.5 border-b border-theme">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[d.status] }} />
                <span className="text-secondary-theme font-medium">{labels[d.status] || d.status}</span>
                <span className="text-muted-theme font-bold">({d.count})</span>
              </div>
              <span className="text-primary-theme font-semibold">{fmt(d.total)}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="border-t border-theme pt-4 flex justify-between items-center text-xs">
        <span className="text-secondary-theme font-medium">A Receber Total:</span>
        <span className="text-sm font-extrabold text-amber-400">{fmt(totalToReceive)}</span>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [withdrawalCount, setWithdrawalCount] = useState(0);
  const [clients, setClients] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("hide_balance") === "true";
    setHideBalance(saved);
  }, []);

  const toggleHideBalance = () => {
    const newVal = !hideBalance;
    setHideBalance(newVal);
    localStorage.setItem("hide_balance", String(newVal));
  };
  const [selectedBarIndex, setSelectedBarIndex] = useState(null);
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showFabDropdown, setShowFabDropdown] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [user, setUser] = useState(null);
  
  // Modals state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Withdraw form state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("cpf");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Charge client form state
  const [selectedClientId, setSelectedClientId] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeLoading, setChargeLoading] = useState(false);
  const [chargeSuccess, setChargeSuccess] = useState(false);
  const [pixCopyPaste, setPixCopyPaste] = useState("");
  const [paymentLink, setPaymentLink] = useState("");

  // Deposit form state
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [depositPixCode, setDepositPixCode] = useState("");
  const [depositLink, setDepositLink] = useState("");

  // Manual Transaction form state
  const [txForm, setTxForm] = useState({
    amount: "",
    type: "income",
    notes: "",
    vehicle_id: "",
    payment_method: "pix"
  });

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, balanceRes, insightsRes, vehiclesRes, userRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/pay/balance"),
        fetch("/api/ai/insights"),
        fetch("/api/locacoes/vehicles").catch(() => null),
        fetch("/api/auth/me").catch(() => null)
      ]);
      
      if (statsRes && statsRes.ok) {
        const d = await statsRes.json();
        setStats(d);
      }
      
      if (balanceRes && balanceRes.ok) {
        const d = await balanceRes.json();
        setWalletBalance(d.wallet_balance || 0);
        setWithdrawalCount(d.withdrawal_count || 0);
        setClients(d.clients || []);
        setTimeline(d.timeline || []);
      }

      if (insightsRes && insightsRes.ok) {
        const d = await insightsRes.json();
        setInsights(d.insights || []);
      }

      if (vehiclesRes && vehiclesRes.ok) {
        const d = await vehiclesRes.json();
        if (d.vehicles) setVehicles(d.vehicles);
      }

      if (userRes && userRes.ok) {
        const d = await userRes.json();
        if (d.user) setUser(d.user);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showFabDropdown && !e.target.closest("#fab-container")) {
        setShowFabDropdown(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [showFabDropdown]);

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!txForm.amount || !txForm.notes) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(txForm.amount),
          type: txForm.type,
          notes: txForm.notes,
          vehicle_id: txForm.vehicle_id || null,
          payment_method: txForm.payment_method
        })
      });
      if (res.ok) {
        setShowTransactionModal(false);
        setTxForm({
          amount: "",
          type: "income",
          notes: "",
          vehicle_id: "",
          payment_method: "pix"
        });
        loadAllData();
        alert("Transação manual registrada com sucesso!");
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao registrar transação.");
      }
    } catch (err) {
      alert("Erro de conexão ao salvar transação.");
    }
  };

  const handleProcessWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0 || !pixKey) return;

    setWithdrawError("");
    try {
      setWithdrawLoading(true);
      const res = await fetch("/api/pay/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          pix_key: pixKey,
          pix_key_type: pixKeyType
        })
      });

      const data = await res.json();
      if (res.ok) {
        setWithdrawSuccess(true);
        loadAllData();
      } else {
        setWithdrawError(data.error || "Falha ao processar saque.");
      }
    } catch (err) {
      console.error(err);
      setWithdrawError("Erro ao comunicar com o servidor.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleCreateCharge = async (e) => {
    e.preventDefault();
    if (!selectedClientId || !chargeAmount || parseFloat(chargeAmount) <= 0) return;

    try {
      setChargeLoading(true);
      const res = await fetch("/api/pay/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: selectedClientId,
          amount: parseFloat(chargeAmount)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPixCopyPaste(data.pix_copy_paste || "Chave Pix indisponível");
        setPaymentLink(data.payment_link || "");
        setChargeSuccess(true);
        loadAllData();
      } else {
        alert(data.error || "Falha ao gerar cobrança.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao gerar cobrança.");
    } finally {
      setChargeLoading(false);
    }
  };

  const handleCreateSelfDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;

    try {
      setDepositLoading(true);
      // Buscar ou Criar um cliente auto-depósito
      let selfClient = clients.find(c => c.category === "Autodepósito");
      
      if (!selfClient) {
        // Criar o cliente auto-depósito para o assinante
        const clientRes = await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${user?.name || "Assinante"} (Autodepósito)`,
            category: "Autodepósito",
            email: user?.email || "",
            phone: user?.whatsapp_phone || ""
          })
        });
        if (!clientRes.ok) {
          const errData = await clientRes.json();
          throw new Error(errData.error || "Erro ao registrar perfil de autodepósito");
        }
        const clData = await clientRes.json();
        selfClient = clData.client;
      }

      // Agora gerar depósito real
      const res = await fetch("/api/pay/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: selfClient.id,
          amount: parseFloat(depositAmount)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setDepositPixCode(data.pix_copy_paste || "Chave Pix indisponível");
        setDepositLink(data.payment_link || "");
        setDepositSuccess(true);
        loadAllData();
      } else {
        alert(data.error || "Falha ao processar depósito.");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Erro de conexão ao processar depósito.");
    } finally {
      setDepositLoading(false);
    }
  };

  if (loading || !stats) return (
    <div className="flex flex-col items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
      <p className="text-secondary-theme text-xs font-semibold tracking-wider">Carregando carteira e métricas...</p>
    </div>
  );

  const fmt = v => `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const actIcons = {
    payment_received: (
      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    reminder_sent: (
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    charge_created: (
      <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    charge_overdue: (
      <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    client_created: (
      <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
      </svg>
    )
  };

  function relTime(d) {
    const diff = (Date.now() - new Date(d)) / 1000;
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }

  const totalToReceive = stats.pendingTotal + stats.overdueTotal;
  const selectedPoint = selectedBarIndex !== null && stats.revenueData ? stats.revenueData[selectedBarIndex] : null;

  return (
    <div className="flex flex-col gap-6 text-left animate-fadeIn">
      
      {/* Main Responsive Grid Wrapper (Desktop: 3 columns; Mobile: 1 stacked column) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Coluna Principal (col-span-2 no Desktop) */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          
          {/* 💳 Premium Redesigned Bank Card */}
          <div className="relative rounded-3xl p-6 bg-gradient-to-br from-[#0c0f1d] via-[#101426] to-[#04060d] border border-emerald-500/20 shadow-2xl overflow-hidden flex flex-col justify-between aspect-[2.1/1] md:aspect-[2.3/1] min-h-[220px]">
            {/* Glow Effects */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Decorative Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none"></div>

            {/* Card Top: Chip + Contactless + Brand */}
            <div className="flex justify-between items-start z-10">
              <div className="flex items-center gap-3">
                {/* Gold Chip */}
                <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 border border-amber-700/20 shadow-md relative overflow-hidden flex-shrink-0">
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_45%,#78350f_45%,#78350f_55%,transparent_55%)] opacity-35"></div>
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_45%,#78350f_45%,#78350f_55%,transparent_55%)] opacity-35"></div>
                  <div className="absolute inset-2 border border-[#78350f]/30 rounded-sm"></div>
                </div>
                
                {/* Contactless Wave */}
                <svg className="w-4 h-4 text-emerald-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 8a5 5 0 0 1 0 8" />
                  <path d="M9 5a9 9 0 0 1 0 14" />
                  <path d="M13 2a13 13 0 0 1 0 20" />
                </svg>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black tracking-widest bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent uppercase">Cobbra Pay</span>
                  <button 
                    onClick={loadAllData}
                    className="p-1 rounded bg-surface-theme border border-theme hover:border-emerald-500/30 text-primary-theme hover:text-emerald-400 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm group"
                    title="Recarregar dados"
                    aria-label="Recarregar dados"
                  >
                    <svg className="w-2.5 h-2.5 text-secondary-theme group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"></path>
                    </svg>
                  </button>
                </div>
                <p className="text-[8px] text-muted-theme font-bold uppercase tracking-wider leading-none mt-0.5">Conta Business</p>
              </div>
            </div>

            {/* Card Middle: Balance display with Hide/Show eye icon */}
            <div className="z-10 my-3">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-muted-theme uppercase tracking-widest">Saldo Disponível</span>
                <button 
                  type="button"
                  onClick={toggleHideBalance}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm focus:outline-none"
                  title={hideBalance ? "Mostrar saldo" : "Ocultar saldo"}
                >
                  {hideBalance ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                      <span className="text-[8px]">Ver Saldo</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-[8px]">Ocultar Saldo</span>
                    </>
                  )}
                </button>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-black text-primary-theme tracking-tight font-mono mt-1.5 transition-all">
                {hideBalance ? "R$ ****" : fmt(walletBalance)}
              </h3>
            </div>

            {/* Card Bottom: Member Name & Card Details */}
            <div className="flex justify-between items-end z-10 border-t border-theme pt-3.5">
              <div className="min-w-0 pr-3">
                <p className="text-[8px] text-muted-theme font-bold uppercase tracking-wider">Titular</p>
                <p className="text-xs font-bold text-primary-theme leading-none uppercase tracking-wide truncate mt-0.5">
                  {user?.business_name || user?.name || "Cobbra Member"}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[8px] text-muted-theme font-bold uppercase tracking-wider">Resgates</p>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">{withdrawalCount} Pix</p>
              </div>
            </div>
          </div>

          {/* 🚀 Interactive Quick Actions Buttons Row */}
          <div className="grid grid-cols-3 gap-3.5">
            <button
              onClick={() => {
                setWithdrawSuccess(false);
                setWithdrawAmount("");
                setWithdrawError("");
                setShowWithdrawModal(true);
              }}
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 active:scale-98 transition-all text-emerald-400 cursor-pointer text-center font-bold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5L12 14.5L5 7.5" />
              </svg>
              <span className="text-[10px] md:text-xs tracking-tight">Sacar Pix</span>
            </button>

            <button
              onClick={() => {
                setDepositSuccess(false);
                setDepositAmount("");
                setShowDepositModal(true);
              }}
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-teal-500/10 hover:bg-teal-500/15 border border-teal-500/20 active:scale-98 transition-all text-teal-400 cursor-pointer text-center font-bold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-[10px] md:text-xs tracking-tight">Depositar</span>
            </button>

            <button
              onClick={() => {
                setChargeSuccess(false);
                setChargeAmount("");
                setSelectedClientId("");
                setShowChargeModal(true);
              }}
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 active:scale-98 transition-all text-blue-400 cursor-pointer text-center font-bold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-[10px] md:text-xs tracking-tight">Cobrar</span>
            </button>
          </div>

          {/* 📑 Mobile-only Compact Statement (Renders on Mobile ONLY, above metrics) */}
          <div className="block lg:hidden bg-card-theme border border-theme rounded-2xl p-4 md:p-6 flex flex-col shadow-lg">
            <div className="flex justify-between items-center pb-3 border-b border-theme mb-4">
              <div>
                <h3 className="text-xs font-black text-primary-theme uppercase tracking-wider">Extrato Rápido</h3>
                <p className="text-[9px] text-muted-theme">Últimas movimentações da conta</p>
              </div>
              <a href="/dashboard/extrato" className="text-[10px] text-emerald-400 font-bold hover:underline select-none">
                Ver completo →
              </a>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {timeline.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs italic">
                  Nenhuma movimentação registrada.
                </div>
              ) : (
                timeline.slice(0, 4).map((item, idx) => {
                  const isCredit = item.type === "credit";
                  return (
                    <div 
                      key={item.id || idx}
                      className="bg-surface-theme border border-theme rounded-xl p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black ${
                          isCredit ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        }`}>
                          {isCredit ? "↓" : "↑"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-primary-theme truncate">{item.description}</p>
                          <p className="text-[9px] text-muted-theme mt-0.5">{new Date(item.date).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-black ${isCredit ? "text-emerald-400" : "text-primary-theme"}`}>
                        {isCredit ? "+" : "-"} {fmt(item.amount)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 📊 Unified Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              icon="money" 
              label="Recebido este mês" 
              value={fmt(stats.totalReceived)} 
              subValue="↑ Faturado" 
              bg="bg-emerald-500/10" 
              color="text-emerald-400" 
              subLabel={`Hoje: ${fmt(stats.receivedToday || 0)}`}
            />
            <StatCard 
              icon="time" 
              label="A Receber Operacional" 
              value={`${stats.pendingCount + stats.overdueCount} títulos`} 
              subValue={fmt(stats.pendingTotal + stats.overdueTotal)} 
              bg="bg-amber-500/10" 
              color="text-amber-500" 
              subLabel={`Vencidos: ${stats.overdueCount} | Pendentes: ${stats.pendingCount}`}
            />
            <StatCard 
              icon="chart" 
              label="Adimplência Geral" 
              value={`${stats.paymentRate}%`} 
              subValue="Score Médio" 
              bg="bg-blue-500/10" 
              color="text-blue-400" 
              subLabel={`${stats.totalClients} clientes cadastrados`}
            />
          </div>

          {/* 📈 Graphic Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-card-theme rounded-2xl border border-theme p-4 md:p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xs font-bold text-primary-theme uppercase tracking-wider">Histórico de Receita</h3>
                  <p className="text-[11px] text-muted-theme mt-0.5">Faturamento acumulado nos últimos 14 dias</p>
                </div>
                
                <div className="text-right">
                  {selectedPoint ? (
                    <div>
                      <p className="text-[10px] text-[#10B981] font-bold uppercase tracking-wider leading-none">
                        {new Date(selectedPoint.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                      </p>
                      <p className="text-sm font-extrabold text-primary-theme mt-1 leading-none">{fmt(selectedPoint.total)}</p>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-theme font-medium bg-surface-theme px-2.5 py-1 rounded border border-theme">
                      Selecione um ponto
                    </span>
                  )}
                </div>
              </div>

              {stats.revenueData && stats.revenueData.length > 0 ? (
                <div className="space-y-4">
                  <AreaChart 
                    data={stats.revenueData} 
                    onSelectPoint={setSelectedBarIndex} 
                    selectedIndex={selectedBarIndex} 
                  />
                  
                  <div className="flex justify-between text-[9px] font-bold text-slate-500 px-2 pt-2 border-t border-theme">
                    <span>{new Date(stats.revenueData[0].date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                    <span>{new Date(stats.revenueData[Math.floor(stats.revenueData.length / 2)].date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                    <span>{new Date(stats.revenueData[stats.revenueData.length - 1].date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-xs text-muted-theme italic">
                  Sem lançamentos registrados no período.
                </div>
              )}
            </div>

            <div className="bg-card-theme rounded-2xl border border-theme p-4 md:p-6">
              <div className="mb-6">
                <h3 className="text-xs font-bold text-primary-theme uppercase tracking-wider">Status das Cobranças</h3>
                <p className="text-[11px] text-muted-theme mt-0.5">Distribuição geral de títulos e quitações</p>
              </div>
              
              {stats.statusDistribution && stats.statusDistribution.length > 0 ? (
                <DonutChart data={stats.statusDistribution} totalToReceive={totalToReceive} />
              ) : (
                <div className="flex items-center justify-center h-40 text-xs text-muted-theme italic">
                  Nenhuma cobrança ativa cadastrada.
                </div>
              )}
            </div>
          </div>

          {/* 🪄 Catarina AI Insights */}
          <div className="bg-card-theme border border-theme rounded-2xl relative overflow-hidden p-6 shadow-lg">
            <div className="absolute -right-20 -top-20 w-44 h-44 bg-[#10B981]/5 blur-3xl pointer-events-none"></div>
            <div className="absolute -left-20 -bottom-20 w-44 h-44 bg-teal-500/5 blur-3xl pointer-events-none"></div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-theme pb-4 mb-4">
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.813-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                <div>
                  <h3 className="text-sm font-bold text-primary-theme flex items-center gap-2">
                    Catarina AI Insights
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                  </h3>
                  <p className="text-[11px] text-muted-theme">Fluxo de inteligência automatizada sobre inadimplência</p>
                </div>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/15 uppercase tracking-wider">
                Gemini 2.5 Flash
              </span>
            </div>

            {insightsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-input-theme rounded-xl border border-theme flex items-center justify-center animate-pulse">
                    <span className="text-[11px] text-muted-theme font-medium">Analisando cobranças...</span>
                  </div>
                ))}
              </div>
            ) : insights.length === 0 ? (
              <p className="text-slate-500 text-xs italic">Registros insuficientes para geração de análises Catarina AI.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.map((insight, idx) => {
                  const borderColors = { success: "border-emerald-500/40", warning: "border-rose-500/40", info: "border-blue-500/40" };
                  const bgColors = { success: "bg-emerald-500/[0.02]", warning: "bg-rose-500/[0.02]", info: "bg-blue-500/[0.02]" };
                  const textColors = { success: "text-emerald-400", warning: "text-rose-500", info: "text-blue-400" };
                  const badgeLabels = { success: "Otimização", warning: "Risco", info: "Insight" };

                  return (
                    <div 
                      key={idx} 
                      className={`border ${borderColors[insight.type] || "border-theme"} ${bgColors[insight.type] || "bg-card-theme"} transition-all duration-300 hover:translate-y-[-3px] hover:shadow-xl rounded-2xl p-4`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-xs font-bold text-primary-theme truncate max-w-[70%]">{insight.title}</h4>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${bgColors[insight.type]} ${textColors[insight.type]}`}>
                          {badgeLabels[insight.type] || "Info"}
                        </span>
                      </div>
                      <p className="text-[11px] text-secondary-theme leading-relaxed">{insight.text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Coluna Lateral (col-span-1 no Desktop, escondida no Mobile) */}
        <div className="hidden lg:flex flex-col gap-6 w-full">
          
          {/* 📑 Desktop-only Extrato Widget (Acima das estatísticas na lateral) */}
          <div className="bg-card-theme border border-theme rounded-2xl p-4 md:p-6 flex flex-col shadow-lg">
            <div className="flex justify-between items-center pb-3 border-b border-theme mb-4">
              <div>
                <h3 className="text-xs font-black text-primary-theme uppercase tracking-wider">Extrato Recente</h3>
                <p className="text-[9px] text-muted-theme">Últimas 8 movimentações integradas</p>
              </div>
              <a href="/dashboard/extrato" className="text-[10px] text-emerald-400 font-bold hover:underline select-none">
                Ver completo →
              </a>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {timeline.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  Nenhuma movimentação registrada na conta.
                </div>
              ) : (
                timeline.slice(0, 8).map((item, idx) => {
                  const isCredit = item.type === "credit";
                  return (
                    <div 
                      key={item.id || idx}
                      className="bg-surface-theme border border-theme rounded-xl p-3 flex items-center justify-between gap-3 hover:border-emerald-500/25 transition-all duration-200"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black ${
                          isCredit ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        }`}>
                          {isCredit ? "↓" : "↑"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-primary-theme truncate">{item.description}</p>
                          <p className="text-[9px] text-muted-theme mt-0.5 font-medium">
                            {new Date(item.date).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-black flex-shrink-0 ${isCredit ? "text-emerald-400" : "text-primary-theme"}`}>
                        {isCredit ? "+" : "-"} {fmt(item.amount)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ⚡ Registro Operacional */}
          <div className="bg-card-theme rounded-2xl border border-theme flex flex-col p-4 md:p-6 shadow-lg">
            <h3 className="text-xs font-bold text-primary-theme uppercase tracking-wider mb-4">Registro Operacional</h3>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
              {(stats.recentActivity || []).slice(0, 5).map((a, i) => (
                <div 
                  key={i} 
                  className="flex gap-3 border-b border-theme last:border-b-0 hover:bg-card-hover-theme rounded-lg transition-colors duration-150 p-2"
                >
                  <div className="w-7 h-7 rounded-lg bg-surface-theme border border-theme flex items-center justify-center flex-shrink-0">
                    {actIcons[a.action] || (
                      <svg className="w-3.5 h-3.5 text-secondary-theme" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-primary-theme truncate leading-snug">{a.details}</p>
                    <p className="text-[9px] text-muted-theme mt-1 font-semibold flex items-center gap-1">
                      <span>{relTime(a.created_at)}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                      <span>{new Date(a.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                    </p>
                  </div>
                </div>
              ))}
              {(!stats.recentActivity || stats.recentActivity.length === 0) && (
                <div className="flex items-center justify-center py-10 text-xs text-muted-theme italic">
                  Nenhum log operacional registrado.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Action Button (FAB) Trigger */}
      <div id="fab-container" className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-50 flex flex-col items-end">
        <div 
          className={`absolute bottom-16 right-0 mb-2 w-56 bg-modal-theme backdrop-blur-xl border border-theme rounded-2xl shadow-2xl p-3 flex flex-col gap-1 transition-all duration-200 origin-bottom-right transform ${
            showFabDropdown 
              ? "scale-100 opacity-100 pointer-events-auto" 
              : "scale-95 opacity-0 pointer-events-none"
          }`}
        >
          <div className="px-3 py-1.5 border-b border-theme mb-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-theme">Ações Rápidas</p>
          </div>
          
          <button
            onClick={() => {
              setShowFabDropdown(false);
              setChargeSuccess(false);
              setChargeAmount("");
              setSelectedClientId("");
              setShowChargeModal(true);
            }}
            className="w-full text-left px-3 py-2 hover:bg-card-hover-theme rounded-xl flex items-center gap-2.5 transition-colors group cursor-pointer"
          >
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs font-bold text-primary-theme group-hover:text-emerald-400 transition-colors">Cobrar Cliente</p>
              <p className="text-[9px] text-muted-theme">Gerar Pix/Fatura para terceiros</p>
            </div>
          </button>

          <button
            onClick={() => {
              setShowFabDropdown(false);
              setDepositSuccess(false);
              setDepositAmount("");
              setShowDepositModal(true);
            }}
            className="w-full text-left px-3 py-2 hover:bg-card-hover-theme rounded-xl flex items-center gap-2.5 transition-colors group cursor-pointer"
          >
            <svg className="w-4 h-4 text-teal-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <div>
              <p className="text-xs font-bold text-primary-theme group-hover:text-teal-400 transition-colors">Depositar Saldo</p>
              <p className="text-[9px] text-muted-theme">Recarga de saldo via Pix próprio</p>
            </div>
          </button>

          <button
            onClick={() => {
              setShowFabDropdown(false);
              setWithdrawSuccess(false);
              setWithdrawAmount("");
              setWithdrawError("");
              setShowWithdrawModal(true);
            }}
            className="w-full text-left px-3 py-2 hover:bg-card-hover-theme rounded-xl flex items-center gap-2.5 transition-colors group cursor-pointer"
          >
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5L12 14.5L5 7.5" />
            </svg>
            <div>
              <p className="text-xs font-bold text-primary-theme group-hover:text-amber-500 transition-colors">Sacar Pix</p>
              <p className="text-[9px] text-muted-theme">Enviar saldo para banco externo</p>
            </div>
          </button>

          <button
            onClick={() => {
              setShowFabDropdown(false);
              setShowTransactionModal(true);
            }}
            className="w-full text-left px-3 py-2 hover:bg-card-hover-theme rounded-xl flex items-center gap-2.5 transition-colors group cursor-pointer"
          >
            <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
            <div>
              <p className="text-xs font-bold text-primary-theme group-hover:text-violet-400 transition-colors">Lançamento Manual</p>
              <p className="text-[9px] text-muted-theme">Registrar despesa ou receita física</p>
            </div>
          </button>
        </div>

        {/* Trigger Button */}
        <button
          onClick={() => setShowFabDropdown(!showFabDropdown)}
          className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/15 active:scale-95 transition-all select-none cursor-pointer border border-emerald-400/20 group font-extrabold"
          title="Ações Rápidas"
        >
          <span className={`text-2xl font-extrabold transition-transform duration-350 ${
            showFabDropdown ? "rotate-[135deg]" : ""
          }`}>+</span>
        </button>
      </div>

      {/* ==================== Saque Modal ==================== */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowWithdrawModal(false)}>
          <div className="bg-modal-theme border border-theme rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowWithdrawModal(false)}
              className="absolute top-4 right-4 text-secondary-theme hover:text-primary-theme text-xl font-light cursor-pointer"
            >
              ×
            </button>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-primary-theme">Resgate Pix Instantâneo</h3>
                <p className="text-[11px] text-secondary-theme mt-0.5">Retire fundos da sua carteira Cobbra Pay direto para sua conta bancária externa.</p>
              </div>

              <div className="p-3 bg-base-theme border border-theme rounded-xl text-xs space-y-1 text-secondary-theme">
                <span className="font-extrabold text-[9px] text-muted-theme uppercase tracking-wider block">Regra de Tarifas</span>
                {withdrawalCount === 0 ? (
                  <p className="text-emerald-400 font-bold">Este é o seu 1º saque do mês. Tarifa Cobbra é 100% GRÁTIS!</p>
                ) : (
                  <p className="text-primary-theme font-semibold">
                    Tarifa por saque: <span className="text-rose-400 font-bold">R$ 3,90</span> (deduzida do valor líquido).
                  </p>
                )}
                <span className="text-[10px] text-muted-theme block mt-1 font-semibold">Saldo disponível para resgate: {fmt(walletBalance)}</span>
              </div>

              {!withdrawSuccess ? (
                <form onSubmit={handleProcessWithdraw} className="space-y-4">
                  {withdrawError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium">
                      {withdrawError}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-secondary-theme uppercase tracking-wider block">Valor do Saque (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        required
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-input-theme border border-theme focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-primary-theme outline-none text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-secondary-theme uppercase tracking-wider block">Tipo de Chave</label>
                        <select
                          value={pixKeyType}
                          onChange={(e) => setPixKeyType(e.target.value)}
                          className="w-full bg-input-theme border border-theme focus:border-emerald-500/50 rounded-xl px-2 py-2.5 text-primary-theme outline-none text-xs cursor-pointer"
                        >
                          <option value="cpf">CPF</option>
                          <option value="cnpj">CNPJ</option>
                          <option value="email">E-mail</option>
                          <option value="phone">Telefone</option>
                          <option value="evp">Chave Aleatória (EVP)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-secondary-theme uppercase tracking-wider block">Chave Pix</label>
                        <input
                          type="text"
                          placeholder="Insira a chave"
                          required
                          value={pixKey}
                          onChange={(e) => setPixKey(e.target.value)}
                          className="w-full bg-input-theme border border-theme focus:border-emerald-500/50 rounded-xl px-3 py-2.5 text-primary-theme outline-none text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={withdrawLoading}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/40 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    {withdrawLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : "Solicitar Transferência"}
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center text-xl font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary-theme">Resgate efetuado!</h4>
                    <p className="text-[11px] text-secondary-theme mt-1">
                      A transferência Pix está sendo enviada da conta Asaas corporativa direto para sua conta de destino.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowWithdrawModal(false);
                      setWithdrawSuccess(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-surface-theme hover:bg-card-hover-theme text-primary-theme border border-theme font-bold text-xs transition-all cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== Depositar Modal ==================== */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowDepositModal(false)}>
          <div className="bg-modal-theme border border-theme rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowDepositModal(false)}
              className="absolute top-4 right-4 text-secondary-theme hover:text-primary-theme text-xl font-light cursor-pointer"
            >
              ×
            </button>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-primary-theme">Adicionar Saldo via Pix</h3>
                <p className="text-[11px] text-secondary-theme mt-0.5">Gere um código Pix para realizar uma recarga de saldo na sua própria conta digital.</p>
              </div>

              {!depositSuccess ? (
                <form onSubmit={handleCreateSelfDeposit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-secondary-theme uppercase tracking-wider block">Valor a Depositar (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      required
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-input-theme border border-theme focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-primary-theme outline-none text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={depositLoading}
                    className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-teal-500/40 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    {depositLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : "Gerar QR Code Pix"}
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-400 mx-auto flex items-center justify-center text-xl font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary-theme">Código Pix de Recarga Gerado!</h4>
                    <p className="text-[11px] text-secondary-theme mt-1">Copie o código Pix Copia e Cola abaixo para efetuar o pagamento da recarga.</p>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[8px] font-extrabold text-muted-theme uppercase tracking-wider">Pix Copia e Cola</label>
                    <textarea
                      readOnly
                      rows="3"
                      value={depositPixCode}
                      onClick={(e) => e.target.select()}
                      className="w-full bg-input-theme border border-theme rounded-xl p-2.5 text-[9px] text-primary-theme font-mono outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(depositPixCode);
                        alert("Pix copiado com sucesso!");
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/25 font-bold text-xs transition-all cursor-pointer"
                    >
                      Copiar Código
                    </button>
                    <button
                      onClick={() => {
                        setShowDepositModal(false);
                        setDepositSuccess(false);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-surface-theme hover:bg-card-hover-theme text-primary-theme font-bold text-xs transition-all cursor-pointer"
                    >
                      Concluído
                    </button>
                  </div>

                  {depositLink && (
                    <a
                      href={depositLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[10px] text-muted-theme hover:text-emerald-400 underline transition-colors"
                    >
                      Visualizar link completo de fatura
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== Cobrar Cliente Modal ==================== */}
      {showChargeModal && (
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowChargeModal(false)}>
          <div className="bg-modal-theme border border-theme rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowChargeModal(false)}
              className="absolute top-4 right-4 text-secondary-theme hover:text-primary-theme text-xl font-light cursor-pointer"
            >
              ×
            </button>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-primary-theme">Emitir Cobrança Pix para Cliente</h3>
                <p className="text-[11px] text-secondary-theme mt-0.5">Gere um código de pagamento instantâneo para um cliente. O valor cai direto no seu saldo.</p>
              </div>

              {!chargeSuccess ? (
                <form onSubmit={handleCreateCharge} className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-secondary-theme uppercase tracking-wider block">Selecione o Cliente</label>
                      <select
                        required
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="w-full bg-input-theme border border-theme focus:border-emerald-500/50 rounded-xl px-3 py-2.5 text-primary-theme outline-none text-xs cursor-pointer"
                      >
                        <option value="">Selecione um cliente...</option>
                        {clients.filter(c => c.category !== "Autodepósito").map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-secondary-theme uppercase tracking-wider block">Valor da Cobrança (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        required
                        value={chargeAmount}
                        onChange={(e) => setChargeAmount(e.target.value)}
                        className="w-full bg-input-theme border border-theme focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-primary-theme outline-none text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={chargeLoading}
                    className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/40 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    {chargeLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : "Gerar QR Code Pix"}
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center text-xl font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary-theme">Código Pix Gerado!</h4>
                    <p className="text-[11px] text-secondary-theme mt-1">Copie o código Pix Gerado abaixo e envie para seu cliente.</p>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[8px] font-extrabold text-muted-theme uppercase tracking-wider">Pix Copia e Cola</label>
                    <textarea
                      readOnly
                      rows="3"
                      value={pixCopyPaste}
                      onClick={(e) => e.target.select()}
                      className="w-full bg-input-theme border border-theme rounded-xl p-2.5 text-[9px] text-primary-theme font-mono outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pixCopyPaste);
                        alert("Pix copiado com sucesso!");
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/25 font-bold text-xs transition-all cursor-pointer"
                    >
                      Copiar Código
                    </button>
                    <button
                      onClick={() => {
                        setShowChargeModal(false);
                        setChargeSuccess(false);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-surface-theme hover:bg-card-hover-theme text-primary-theme font-bold text-xs transition-all cursor-pointer"
                    >
                      Concluído
                    </button>
                  </div>

                  {paymentLink && (
                    <a
                      href={paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[10px] text-muted-theme hover:text-emerald-400 underline transition-colors"
                    >
                      Visualizar link completo de fatura
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 💸 Manual Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowTransactionModal(false)}>
          <div className="bg-modal-theme border border-theme rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-theme flex justify-between items-center">
              <h3 className="text-sm font-bold text-primary-theme flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
                Lançamento Financeiro Manual
              </h3>
              <button onClick={() => setShowTransactionModal(false)} className="text-secondary-theme hover:text-primary-theme text-sm">✕</button>
            </div>
            <form onSubmit={handleTransactionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Tipo de Lançamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxForm(prev => ({ ...prev, type: "income" }))}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      txForm.type === "income"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                        : "bg-transparent text-secondary-theme border-theme hover:border-emerald-500/20"
                    }`}
                  >
                    Receita (Entrada)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxForm(prev => ({ ...prev, type: "expense" }))}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      txForm.type === "expense"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-sm shadow-rose-500/10"
                        : "bg-transparent text-secondary-theme border-theme hover:border-rose-500/20"
                    }`}
                  >
                    Despesa (Saída)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Destinação</label>
                <select
                  value={txForm.vehicle_id}
                  onChange={e => setTxForm(prev => ({ ...prev, vehicle_id: e.target.value }))}
                  className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="">Empresa (Geral / Caixa Corporativo)</option>
                  {vehicles.length > 0 && (
                    <optgroup label="Frota de Veículos">
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.model} - {v.plate}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={txForm.amount}
                    onChange={e => setTxForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Forma de Pagamento</label>
                  <select
                    value={txForm.payment_method}
                    onChange={e => setTxForm(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="pix">Pix</option>
                    <option value="boleto">Boleto</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="cash">Dinheiro</option>
                    <option value="bank_transfer">Transferência Bancária</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Descrição / Justificativa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Abastecimento, Recebimento avulso..."
                  value={txForm.notes}
                  onChange={e => setTxForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="px-4 py-2.5 rounded-lg bg-surface-theme hover:bg-card-hover-theme border border-theme text-primary-theme text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
                >
                  Lançar Transação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
