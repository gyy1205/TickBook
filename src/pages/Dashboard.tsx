import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Ticket } from '../types';
import { fetchTickets, deleteTicket } from '../services/ticketService';
import TicketCard from '../components/TicketCard';

interface GroupedTickets {
  year: string;
  months: {
    month: string;
    label: string;
    tickets: Ticket[];
  }[];
}

function groupByYearMonth(tickets: Ticket[]): GroupedTickets[] {
  const yearMap = new Map<string, Map<string, Ticket[]>>();

  tickets.forEach((t) => {
    if (!t.departure_date) return;
    const [year, month] = t.departure_date.split('-');
    if (!yearMap.has(year)) yearMap.set(year, new Map());
    const monthMap = yearMap.get(year)!;
    if (!monthMap.has(month)) monthMap.set(month, []);
    monthMap.get(month)!.push(t);
  });

  return Array.from(yearMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, monthMap]) => ({
      year,
      months: Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, tickets]) => ({
          month,
          label: `${parseInt(month)}月`,
          tickets: tickets.sort((a, b) => {
            const dateCmp = (a.departure_date || '').localeCompare(b.departure_date || '');
            if (dateCmp !== 0) return dateCmp;
            return (a.departure_time || '').localeCompare(b.departure_time || '');
          }),
        })),
    }));
}

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchTickets();
      setTickets(data);
    } catch (err) {
      console.error('加载票据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteTicket(id);
    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  const filtered = tickets.filter(
    (t) =>
      t.train_number.toLowerCase().includes(search.toLowerCase()) ||
      t.passenger_name.toLowerCase().includes(search.toLowerCase()) ||
      t.departure_station.toLowerCase().includes(search.toLowerCase()) ||
      t.arrival_station.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = groupByYearMonth(filtered);

  return (
    <div>
      {/* 顶部操作栏 */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">我的票据</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索车次、站名、乘客..."
            className="flex-1 sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <Link
            to="/tickets/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 no-underline whitespace-nowrap transition-colors"
          >
            + 新建
          </Link>
        </div>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="text-center text-gray-400 py-20">加载中...</div>
      ) : grouped.length === 0 ? (
        <div className="text-center text-gray-400 py-20">
          {search ? '没有匹配的票据' : '还没有票据，点击右上角"新建"开始添加'}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((yearGroup) => (
            <section key={yearGroup.year}>
              {/* 年份标题 */}
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full inline-block" />
                {yearGroup.year}年
              </h2>

              {/* 月份分组 */}
              <div className="space-y-6">
                {yearGroup.months.map((monthGroup) => (
                  <div key={monthGroup.month}>
                    <h3 className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full inline-block" />
                      {monthGroup.label}
                      <span className="text-gray-300">· {monthGroup.tickets.length}张</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {monthGroup.tickets.map((ticket) => (
                        <TicketCard
                          key={ticket.id}
                          ticket={ticket}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
