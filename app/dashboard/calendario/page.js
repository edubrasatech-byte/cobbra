'use client';
import { useState, useEffect } from 'react';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function CalendarioPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [calendarData, setCalendarData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  function loadCalendar(y, m) {
    setLoading(true);
    fetch(`/api/dashboard/calendar?year=${y}&month=${m}`)
      .then(r => r.json())
      .then(data => {
        setCalendarData(data.calendar || {});
        setSummary(data.summary || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadCalendar(year, month);
  }, [year, month]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
    setSelectedDay(null); setShowDrawer(false);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
    setSelectedDay(null); setShowDrawer(false);
  }

  function handleDayClick(dayData) {
    if (dayData.totalGeneral > 0 || dayData.isFeriado) {
      setSelectedDay(dayData);
      setShowDrawer(true);
    }
  }

  // Build grid: find first day of month offset
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const lastDay = new Date(year, month, 0).getDate();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const gridCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) gridCells.push(null);
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    gridCells.push(calendarData ? calendarData[dateStr] : null);
  }

  const cardS = { background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <div>
      <style>{`
        .cal-responsive-styles .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
        .cal-responsive-styles .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .cal-responsive-styles .header-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .cal-responsive-styles .cal-cell { min-height: 90px; background: rgba(255,255,255,0.02); border-radius: 10px; padding: 8px; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; position: relative; }
        .cal-responsive-styles .cal-cell:hover { background: rgba(5,150,105,0.08); border-color: rgba(5,150,105,0.2); }
        .cal-responsive-styles .cal-cell.has-items { border-color: rgba(5,150,105,0.15); }
        .cal-responsive-styles .cal-cell.is-today { border-color: #059669; box-shadow: 0 0 12px rgba(5,150,105,0.25); }
        .cal-responsive-styles .cal-cell.is-feriado { background: rgba(239,68,68,0.05); border-color: rgba(239,68,68,0.15); }
        .cal-responsive-styles .cal-cell.is-saturday { background: rgba(139,92,246,0.04); }
        .cal-responsive-styles .cal-cell.is-sunday { background: rgba(245,158,11,0.04); }
        .cal-responsive-styles .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; backdrop-filter: blur(4px); }
        .cal-responsive-styles .drawer-panel { position: fixed; bottom: 0; left: 0; right: 0; max-height: 70vh; background: #1e293b; border-radius: 20px 20px 0 0; z-index: 1001; overflow-y: auto; padding: 24px; border-top: 2px solid #059669; animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @media (min-width: 768px) {
          .cal-responsive-styles .drawer-panel { position: fixed; bottom: auto; top: 50%; left: 50%; right: auto; transform: translate(-50%, -50%); max-height: 80vh; width: 520px; border-radius: 20px; border-top: none; border: 1px solid rgba(5,150,105,0.3); animation: fadeIn 0.25s ease; }
          @keyframes fadeIn { from { opacity: 0; transform: translate(-50%, -45%); } to { opacity: 1; transform: translate(-50%, -50%); } }
        }
        @media (max-width: 1024px) {
          .cal-responsive-styles .summary-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .cal-responsive-styles .summary-grid { grid-template-columns: 1fr; }
          .cal-responsive-styles .cal-cell { min-height: 60px; padding: 4px; }
          .cal-responsive-styles .cal-cell .day-num { font-size: 11px !important; }
          .cal-responsive-styles .cal-cell .amount-badge { font-size: 8px !important; padding: 1px 3px !important; }
          .cal-responsive-styles .header-nav h2 { font-size: 18px !important; }
        }
      `}</style>

      <div className="cal-responsive-styles">
        {/* Header with month navigation */}
        <div className="header-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px', color: '#e2e8f0', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(5,150,105,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>◀</button>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>
              📅 {MESES[month]} de {year}
            </h2>
            <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px', color: '#e2e8f0', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(5,150,105,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>▶</button>
          </div>
          <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1); }} style={{ background: 'linear-gradient(135deg,#059669,#0d9488)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Hoje</button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="summary-grid">
            <div style={cardS}>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 600 }}>TOTAL DO MÊS</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#10b981', margin: 0 }}>{fmt(summary.totalMonth || 0)}</p>
            </div>
            <div style={cardS}>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 600 }}>COBRANÇAS AVULSAS</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6', margin: 0 }}>{fmt(summary.totalMonthCharges || 0)}</p>
            </div>
            <div style={cardS}>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 600 }}>FATURAMENTO DIÁRIO</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', margin: 0 }}>{fmt(summary.totalMonthDaily || 0)}</p>
            </div>
            <div style={cardS}>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 600 }}>DIAS COM COBRANÇA</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#8b5cf6', margin: 0 }}>{summary.daysWithBilling || 0}<span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}> dias</span></p>
            </div>
          </div>
        )}

        {/* Feriados badge */}
        {summary && summary.feriadosNoMes && summary.feriadosNoMes.length > 0 && (
          <div style={{ ...cardS, marginBottom: 20, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', margin: '0 0 8px 0' }}>🎉 Feriados neste mês:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {summary.feriadosNoMes.map((f, i) => (
                <span key={i} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', color: '#fcd34d', fontWeight: 600 }}>
                  {new Date(f.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — {f.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Carregando calendário...</div>
        ) : (
          <div style={{ ...cardS, padding: 16 }}>
            {/* Day headers */}
            <div className="cal-grid" style={{ marginBottom: 8 }}>
              {DIAS_SEMANA.map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: i === 0 ? '#f59e0b' : i === 6 ? '#8b5cf6' : '#94a3b8', padding: '8px 0' }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="cal-grid">
              {gridCells.map((dayData, i) => {
                if (!dayData) return <div key={`empty-${i}`} style={{ minHeight: 60 }} />;

                const isToday = dayData.date === todayStr;
                const hasItems = dayData.totalGeneral > 0;
                const dayNum = parseInt(dayData.date.split('-')[2]);

                let cellClass = 'cal-cell';
                if (isToday) cellClass += ' is-today';
                if (hasItems) cellClass += ' has-items';
                if (dayData.isFeriado) cellClass += ' is-feriado';
                else if (dayData.isSunday) cellClass += ' is-sunday';
                else if (dayData.isSaturday) cellClass += ' is-saturday';

                return (
                  <div key={dayData.date} className={cellClass} onClick={() => handleDayClick(dayData)}>
                    <div className="day-num" style={{ fontSize: 13, fontWeight: isToday ? 800 : 600, color: isToday ? '#10b981' : dayData.isFeriado ? '#ef4444' : dayData.isSunday ? '#f59e0b' : '#e2e8f0', marginBottom: 4 }}>
                      {dayNum}
                      {dayData.isFeriado && <span style={{ fontSize: 9, marginLeft: 2 }}>🎌</span>}
                    </div>

                    {dayData.totalCharges > 0 && (
                      <div className="amount-badge" style={{ fontSize: 9, padding: '2px 4px', borderRadius: 4, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontWeight: 700, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        💰 {fmt(dayData.totalCharges)}
                      </div>
                    )}

                    {dayData.totalDailyBilling > 0 && (
                      <div className="amount-badge" style={{ fontSize: 9, padding: '2px 4px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        📅 {fmt(dayData.totalDailyBilling)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(59,130,246,0.4)' }} /> Cobrança Avulsa</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(245,158,11,0.4)' }} /> Faturamento Diário</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(239,68,68,0.3)' }} /> Feriado</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#059669' }} /> Hoje</span>
            </div>
          </div>
        )}

        {/* Day Detail Drawer / Slide-up Panel */}
        {showDrawer && selectedDay && (
          <>
            <div className="drawer-overlay" onClick={() => setShowDrawer(false)} />
            <div className="drawer-panel">
              {/* Drag handle for mobile */}
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 16px auto' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>
                    📅 {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </h3>
                  {selectedDay.isFeriado && (
                    <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>🎌 {selectedDay.feriadoName}</span>
                  )}
                </div>
                <button onClick={() => setShowDrawer(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px', color: '#e2e8f0', fontSize: 18, cursor: 'pointer' }}>✕</button>
              </div>

              {/* Total summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 600 }}>TOTAL GERAL</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#10b981', margin: 0 }}>{fmt(selectedDay.totalGeneral)}</p>
                </div>
                <div style={{ background: 'rgba(59,130,246,0.08)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 600 }}>AVULSAS</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#3b82f6', margin: 0 }}>{fmt(selectedDay.totalCharges)}</p>
                </div>
                <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 600 }}>DIÁRIO</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b', margin: 0 }}>{fmt(selectedDay.totalDailyBilling)}</p>
                </div>
              </div>

              {/* Charges list */}
              {selectedDay.charges.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', marginBottom: 10 }}>💰 Cobranças Avulsas ({selectedDay.charges.length})</p>
                  {selectedDay.charges.map((c, i) => {
                    const statusColors = { paid: '#10b981', pending: '#f59e0b', overdue: '#ef4444', reminder_sent: '#3b82f6', cancelled: '#64748b' };
                    const statusLabels = { paid: 'Pago', pending: 'Pendente', overdue: 'Vencido', reminder_sent: 'Lembrete', cancelled: 'Cancelado' };
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', marginBottom: 6, border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💰</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.client_name}</p>
                          <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{c.description || 'Cobrança'}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{fmt(c.amount)}</p>
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: `${statusColors[c.status] || '#64748b'}20`, color: statusColors[c.status] || '#64748b', fontWeight: 700 }}>{statusLabels[c.status] || c.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Daily billings list */}
              {selectedDay.dailyBillings.length > 0 && (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 10 }}>📅 Faturamento Diário ({selectedDay.dailyBillings.length})</p>
                  {selectedDay.dailyBillings.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', marginBottom: 6, border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📅</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.client_name}</p>
                        <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{d.description}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', margin: 0 }}>{fmt(d.amount)}</p>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                          {d.exclude_saturdays ? <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>🚫Sáb</span> : null}
                          {d.exclude_sundays_holidays ? <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>🚫Dom+Fer</span> : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedDay.totalGeneral === 0 && (
                <div style={{ textAlign: 'center', padding: 30 }}>
                  <p style={{ fontSize: 28, marginBottom: 8 }}>{selectedDay.isFeriado ? '🎉' : '😌'}</p>
                  <p style={{ fontSize: 14, color: '#94a3b8' }}>{selectedDay.isFeriado ? `Feriado: ${selectedDay.feriadoName}` : 'Nenhuma cobrança prevista para este dia'}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
