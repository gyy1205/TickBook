import { Fragment, memo, useCallback, useEffect, useRef, useState } from 'react';
import { PenLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Ticket } from '../types';
import { fetchTickets, updateTicket } from '../services/ticketService';
import TicketTemplate from '../components/TicketTemplate';

const PER_PAGE = 6;

// ---- 可翻转的票据卡片 ----

interface TicketCardProps {
  ticket: Ticket;
  flipped: boolean;
  notes: string;
  onFlip: (id: string) => void;
  onNotesChange: (id: string, notes: string) => void;
}

const TicketCard = memo(function TicketCard({
  ticket,
  flipped,
  notes,
  onFlip,
  onNotesChange,
}: TicketCardProps) {
  const ticketId = ticket.id!;

  return (
    <div style={{ width: '80%', perspective: '800px' }}>
      <div
        onClick={() => onFlip(ticketId)}
        style={{
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.5s cubic-bezier(0.42, 0.0, 0.58, 1.0)',
          cursor: 'pointer',
        }}
      >
        {/* 正面：票据 */}
        <div style={{ backfaceVisibility: 'hidden' }}>
          <TicketTemplate ticket={ticket} />
        </div>

        {/* 背面：记事本 */}
        <div
          className="rounded-lg shadow-lg overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fef7ed',
            border: '1px solid #e2d5b7',
          }}
        >
          <div
            className="flex-1 flex flex-col"
            style={{
              backgroundImage:
                'repeating-linear-gradient(transparent, transparent 27px, #e8dcc8 27px, #e8dcc8 28px)',
              backgroundSize: '100% 28px',
              paddingTop: 6,
            }}
          >
            <div
              className="flex items-center justify-between px-4 pt-2 pb-1 select-none"
              style={{ background: 'linear-gradient(to bottom, #fef7ed 60%, transparent)' }}
            >
              <span className="text-xs font-medium text-amber-700 flex items-center gap-1"><PenLine size={14} />旅行笔记</span>
              <span className="text-xs text-amber-400">{ticket.train_number}</span>
            </div>

            <textarea
              value={notes}
              onChange={(e) => onNotesChange(ticketId, e.target.value)}
              placeholder="记录这段旅程的回忆..."
              className="flex-1 mx-3 mb-1 px-2 py-1 bg-transparent resize-none text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
              style={{ lineHeight: '28px' }}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
            />

            <div
              className="text-center pb-2 select-none"
              style={{ background: 'linear-gradient(to top, #fef7ed 60%, transparent)' }}
            >
              <span className="text-xs text-amber-300">点击空白处返回</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ---- 票据占位槽 ----

function TicketSlot({
  ticket,
  flipped,
  notes,
  onFlip,
  onNotesChange,
}: {
  ticket?: Ticket;
  flipped: boolean;
  notes: string;
  onFlip: (id: string) => void;
  onNotesChange: (id: string, notes: string) => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-0">
      {ticket ? (
        <TicketCard ticket={ticket} flipped={flipped} notes={notes} onFlip={onFlip} onNotesChange={onNotesChange} />
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}

// ---- 静态书页（无翻页动画） ----

function StaticPage({
  tickets,
  flippedCardIds,
  notesCache,
  onFlip,
  onNotesChange,
}: {
  tickets: (Ticket | undefined)[];
  flippedCardIds: Set<string>;
  notesCache: Record<string, string>;
  onFlip: (id: string) => void;
  onNotesChange: (id: string, notes: string) => void;
}) {
  return (
    <>
      {tickets.map((ticket, idx) => (
        <Fragment key={idx}>
          <TicketSlot
            ticket={ticket}
            flipped={ticket ? flippedCardIds.has(ticket.id!) : false}
            notes={ticket ? (notesCache[ticket.id!] ?? ticket.notes ?? '') : ''}
            onFlip={onFlip}
            onNotesChange={onNotesChange}
          />
        </Fragment>
      ))}
    </>
  );
}

// ---- BookPage ----

export default function BookPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  // 票据卡片翻转 & 笔记
  const [flippedCardIds, setFlippedCardIds] = useState<Set<string>>(new Set());
  const [notesCache, setNotesCache] = useState<Record<string, string>>({});
  const notesRef = useRef<Record<string, string>>({});
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    fetchTickets()
      .then((t) => {
        setTickets(t);
        const cache: Record<string, string> = {};
        t.forEach((tk) => {
          if (tk.id) {
            cache[tk.id] = tk.notes || '';
            notesRef.current[tk.id] = tk.notes || '';
          }
        });
        setNotesCache(cache);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach(clearTimeout);
    };
  }, []);

  const handleCardFlip = useCallback((ticketId: string) => {
    setFlippedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
        if (saveTimers.current[ticketId]) {
          clearTimeout(saveTimers.current[ticketId]);
          delete saveTimers.current[ticketId];
        }
        updateTicket(ticketId, { notes: notesRef.current[ticketId] ?? '' }).catch(console.error);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  }, []);

  const handleNotesChange = useCallback((ticketId: string, notes: string) => {
    notesRef.current = { ...notesRef.current, [ticketId]: notes };
    setNotesCache((prev) => ({ ...prev, [ticketId]: notes }));
    if (saveTimers.current[ticketId]) clearTimeout(saveTimers.current[ticketId]);
    saveTimers.current[ticketId] = setTimeout(() => {
      updateTicket(ticketId, { notes }).catch(console.error);
      delete saveTimers.current[ticketId];
    }, 1500);
  }, []);

  const totalPages = Math.max(1, Math.ceil(tickets.length / PER_PAGE));

  const goPrev = () => {
    if (page > 0) setPage(page - 1);
  };

  const goNext = () => {
    if (page < totalPages - 1) setPage(page + 1);
  };

  const jumpToPage = (targetPage: number) => {
    setPage(targetPage);
  };

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
          <Link to="/tickets/new" className="text-blue-600 text-sm hover:underline">
            添加票据
          </Link>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="flex w-full max-w-4xl" style={{ minHeight: 600 }}>
            {/* 活页环扣 - 左侧 */}
            <div className="w-7 flex-shrink-0 flex flex-col items-center justify-around py-8 bg-blue-200 rounded-l-lg border-y-2 border-blue-400">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border-2 border-blue-600 bg-amber-100 flex items-center justify-center"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-700" />
                </div>
              ))}
            </div>

            {/* 左页 */}
            <div className="flex-1 relative bg-blue-50 border-y-2 border-r-2 border-gray-300 p-4 flex flex-col gap-5">
              {page > 0 && (
                <button
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/70 hover:bg-white/90 rounded-full flex items-center justify-center text-blue-600 text-xl transition-all shadow-md hover:shadow-lg"
                >
                  ‹
                </button>
              )}
              <StaticPage
                tickets={leftTickets}
                flippedCardIds={flippedCardIds}
                notesCache={notesCache}
                onFlip={handleCardFlip}
                onNotesChange={handleNotesChange}
              />
              <div
                className="absolute inset-y-0 right-0 w-5 pointer-events-none"
                style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.06), transparent)' }}
              />
            </div>

            {/* 书脊 */}
            <div className="w-3 flex-shrink-0 bg-gradient-to-r from-blue-300 via-blue-400 to-blue-300 shadow-inner" />

            {/* 右页 */}
            <div className="flex-1 relative bg-blue-50 border-y-2 border-l-2 border-gray-300 p-4 flex flex-col gap-5">
              {page < totalPages - 1 && (
                <button
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/70 hover:bg-white/90 rounded-full flex items-center justify-center text-blue-600 text-xl transition-all shadow-md hover:shadow-lg"
                >
                  ›
                </button>
              )}
              <StaticPage
                tickets={rightTickets}
                flippedCardIds={flippedCardIds}
                notesCache={notesCache}
                onFlip={handleCardFlip}
                onNotesChange={handleNotesChange}
              />
              <div
                className="absolute inset-y-0 left-0 w-5 pointer-events-none"
                style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.06), transparent)' }}
              />
            </div>

            {/* 活页环扣 - 右侧 */}
            <div className="w-7 flex-shrink-0 flex flex-col items-center justify-around py-8 bg-blue-200 rounded-r-lg border-y-2 border-blue-400">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border-2 border-blue-600 bg-amber-100 flex items-center justify-center"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-700" />
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
            <button
              key={i}
              onClick={() => jumpToPage(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === page ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
