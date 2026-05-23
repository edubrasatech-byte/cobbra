import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// Feriados nacionais fixos brasileiros (mês é 0-indexed internamente, mas armazenamos 1-indexed)
const FERIADOS_FIXOS = [
  { month: 1, day: 1, name: 'Confraternização Universal' },
  { month: 4, day: 21, name: 'Tiradentes' },
  { month: 5, day: 1, name: 'Dia do Trabalho' },
  { month: 9, day: 7, name: 'Independência do Brasil' },
  { month: 10, day: 12, name: 'Nossa Senhora Aparecida' },
  { month: 11, day: 2, name: 'Finados' },
  { month: 11, day: 15, name: 'Proclamação da República' },
  { month: 11, day: 20, name: 'Consciência Negra' },
  { month: 12, day: 25, name: 'Natal' },
];

function isFeriadoNacional(date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return FERIADOS_FIXOS.find(f => f.month === m && f.day === d) || null;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();
    const month = parseInt(searchParams.get('month')) || (new Date().getMonth() + 1);

    // Build date range for the month
    const startDate = `${year}-${pad(month)}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${pad(month)}-${pad(lastDay)}`;

    // 1. Fetch standard charges (cobranças avulsas) with due_date in this month
    const charges = query(
      `SELECT c.id, c.amount, c.description, c.due_date, c.status, c.paid_at, c.paid_amount,
              cl.name as client_name, cl.id as client_id
       FROM charges c
       LEFT JOIN clients cl ON c.client_id = cl.id
       WHERE c.user_id = ? AND c.due_date >= ? AND c.due_date <= ?
       ORDER BY c.due_date ASC`,
      [user.id, startDate, endDate]
    );

    // 2. Fetch active daily billing contracts
    const dailyBills = query(
      `SELECT d.*, c.name as client_name
       FROM daily_billing d
       LEFT JOIN clients c ON d.client_id = c.id
       WHERE d.user_id = ? AND d.status = 'active'`,
      [user.id]
    );

    // 3. Build day-by-day map
    const calendarData = {};

    // Initialize all days
    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${year}-${pad(month)}-${pad(day)}`;
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay(); // 0=Dom, 6=Sáb
      const feriado = isFeriadoNacional(dateObj);

      calendarData[dateStr] = {
        date: dateStr,
        dayOfWeek,
        isSaturday: dayOfWeek === 6,
        isSunday: dayOfWeek === 0,
        isFeriado: !!feriado,
        feriadoName: feriado ? feriado.name : null,
        charges: [],
        dailyBillings: [],
        totalCharges: 0,
        totalDailyBilling: 0,
        totalGeneral: 0
      };
    }

    // Add standard charges to their due dates
    for (const charge of charges) {
      const dateStr = charge.due_date.substring(0, 10);
      if (calendarData[dateStr]) {
        calendarData[dateStr].charges.push({
          id: charge.id,
          type: 'charge',
          client_name: charge.client_name,
          client_id: charge.client_id,
          amount: charge.amount,
          description: charge.description,
          status: charge.status,
          paid_amount: charge.paid_amount
        });
        calendarData[dateStr].totalCharges += charge.amount;
      }
    }

    // Project daily billings onto each applicable day
    for (const bill of dailyBills) {
      const billCreated = bill.created_at ? bill.created_at.substring(0, 10) : '2000-01-01';
      const billEnd = bill.end_date || null;

      for (let day = 1; day <= lastDay; day++) {
        const dateStr = `${year}-${pad(month)}-${pad(day)}`;
        const dateObj = new Date(year, month - 1, day);

        // Check if this date is within the contract period
        if (dateStr < billCreated) continue;
        if (billEnd && dateStr > billEnd) continue;

        // Check exclusions
        const dayOfWeek = dateObj.getDay();

        if (bill.exclude_saturdays && dayOfWeek === 6) continue;
        if (bill.exclude_sundays_holidays) {
          if (dayOfWeek === 0) continue;
          if (isFeriadoNacional(dateObj)) continue;
        }

        calendarData[dateStr].dailyBillings.push({
          id: bill.id,
          type: 'daily',
          client_name: bill.client_name,
          client_id: bill.client_id,
          amount: bill.amount,
          description: bill.description || 'Faturamento diário',
          interest_rate: bill.interest_rate,
          exclude_saturdays: bill.exclude_saturdays,
          exclude_sundays_holidays: bill.exclude_sundays_holidays
        });
        calendarData[dateStr].totalDailyBilling += bill.amount;
      }
    }

    // Calculate totals
    for (const dateStr in calendarData) {
      calendarData[dateStr].totalGeneral = calendarData[dateStr].totalCharges + calendarData[dateStr].totalDailyBilling;
    }

    // Summary stats
    const totalMonthCharges = Object.values(calendarData).reduce((s, d) => s + d.totalCharges, 0);
    const totalMonthDaily = Object.values(calendarData).reduce((s, d) => s + d.totalDailyBilling, 0);
    const daysWithBilling = Object.values(calendarData).filter(d => d.totalGeneral > 0).length;

    return Response.json({
      year,
      month,
      lastDay,
      calendar: calendarData,
      summary: {
        totalMonthCharges,
        totalMonthDaily,
        totalMonth: totalMonthCharges + totalMonthDaily,
        daysWithBilling,
        feriadosNoMes: Object.values(calendarData).filter(d => d.isFeriado).map(d => ({
          date: d.date,
          name: d.feriadoName
        }))
      }
    });
  } catch (error) {
    console.error('Calendar API Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
