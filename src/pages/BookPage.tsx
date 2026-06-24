import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Ticket } from '../types';
import { fetchTickets } from '../services/ticketService';
import TicketTemplate from '../components/TicketTemplate';

const PER_PAGE = 6;

export default function BookPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchTickets()
      .then((t) => setTickets(t))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(tickets.length / PER_PAGE));
  const currentTickets = tickets.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const leftTickets = currentTickets.slice(0, 3);
  const rightTickets = currentTickets.slice(3, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-2">票据展示</h1>
      <p className="text-sm text-gray-400 mb-6">
        第 {page + 1} / {totalPages} 页 · 共 {tickets.length} 张票据
      </p>

      {tickets.length === 0 ? (
        <div className="text-center text-gray-400 py-20">
          <p className="mb-4">还没有票据，快去添加吧</p>
          <Link to="/tickets/new" className="text-blue-600 text-sm hover:underline">添加票据</Link>
        </div>
      ) : (
        <div className="flex justify-center">
          {/* 书本容器 */}
          <div className="flex w-full max-w-4xl shadow-2xl rounded-lg overflow-hidden border-2 border-amber-500"
            style={{ minHeight: 600 }}>

            {/* ====== 左页 ====== */}
            <div className="flex-1 bg-amber-50 p-4 relative flex flex-col gap-3 border-r border-dashed border-amber-300">
              {/* 左翻页箭头 */}
              <button onClick={() => page > 0 && setPage(page - 1)} disabled={page === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-amber-200/80 hover:bg-amber-300/80 rounded-full flex items-center justify-center text-amber-700 disabled:opacity-15 text-xl transition-colors">‹</button>

              {[0, 1, 2].map((idx) => (
                <div key={idx} className="flex-1 flex items-center justify-center min-h-0">
                  {leftTickets[idx] ? (
                    <div style={{ width: '80%' }}><TicketTemplate ticket={leftTickets[idx]} /></div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* ====== 书脊 ====== */}
            <div className="w-5 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 flex-shrink-0 shadow-inner" />

            {/* ====== 右页 ====== */}
            <div className="flex-1 bg-amber-50 p-4 relative flex flex-col gap-3 border-l border-dashed border-amber-300">
              {/* 右翻页箭头 */}
              <button onClick={() => page < totalPages - 1 && setPage(page + 1)} disabled={page >= totalPages - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-amber-200/80 hover:bg-amber-300/80 rounded-full flex items-center justify-center text-amber-700 disabled:opacity-15 text-xl transition-colors">›</button>

              {[0, 1, 2].map((idx) => (
                <div key={idx} className="flex-1 flex items-center justify-center min-h-0">
                  {rightTickets[idx] ? (
                    <div style={{ width: '80%' }}><TicketTemplate ticket={rightTickets[idx]} /></div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 页码圆点 */}
      {tickets.length > 0 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${i === page ? 'bg-blue-600' : 'bg-gray-300'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
