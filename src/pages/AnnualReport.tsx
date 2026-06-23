import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchTickets } from '../services/ticketService';
import { computeStatistics } from '../services/statistics';
import { computeProvinceVisits } from '../utils/stationMap';
import { groupByMonth } from '../utils/statCalc';
import type { Ticket } from '../types';

function formatPrice(n: number) { return '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 2 }); }

export default function AnnualReport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchTickets().then((t) => { setTickets(t); setLoading(false); });
  }, []);

  // 可用的年份
  const availableYears = useMemo(() => {
    const years = [...new Set(tickets.filter((t) => t.departure_date).map((t) => parseInt(t.departure_date.substring(0, 4))))] as number[];
    return years.sort((a, b) => b - a);
  }, [tickets]);

  // 当前年份的票据
  const yearTickets = useMemo(() =>
    tickets.filter((t) => t.departure_date && t.departure_date.startsWith(String(year))),
    [tickets, year]);

  const stats = useMemo(() => computeStatistics(yearTickets), [yearTickets]);
  const provinces = useMemo(() => computeProvinceVisits(yearTickets), [yearTickets]);
  const months = useMemo(() => groupByMonth(yearTickets), [yearTickets]);

  const totalDays = useMemo(() => new Set(yearTickets.filter((t) => t.departure_date).map((t) => t.departure_date)).size, [yearTickets]);
  const earliestTicket = useMemo(() => [...yearTickets].sort((a, b) => (a.departure_date || '').localeCompare(b.departure_date || ''))[0], [yearTickets]);
  const maxMonth = useMemo(() => months.reduce((a, b) => (b.count > a.count ? b : a), months[0] || { month: '--', count: 0 }), [months]);

  const handleNext = () => { if (slide < 5) setSlide(slide + 1); };
  const handlePrev = () => { if (slide > 0) setSlide(slide - 1); };
  const yearIdx = availableYears.indexOf(year);
  const canPrev = yearIdx < availableYears.length - 1;
  const canNext = yearIdx > 0;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [slide]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
      </div>
    );
  }

  const SLIDES = [
    { bg: 'from-blue-900 via-indigo-900 to-purple-900', content: (
      <div className="text-center text-white">
        <p className="text-lg opacity-60 tracking-widest mb-4">TICKBOOK · 年度出行报告</p>
        <p className="text-5xl font-bold mb-2">{year}</p>
        <p className="text-2xl opacity-80">{yearTickets.length > 0 ? '这一年，你去了很多地方' : '这一年还没有出行记录'}</p>
      </div>
    )},
    { bg: 'from-slate-900 via-gray-900 to-slate-900', content: (
      <div className="text-center text-white">
        <p className="text-sm opacity-50 mb-8">出行数据总览</p>
        <div className="grid grid-cols-2 gap-6">
          <div><p className="text-4xl font-bold text-blue-400">{stats.totalCount}</p><p className="text-sm opacity-50 mt-1">张车票</p></div>
          <div><p className="text-4xl font-bold text-amber-400">{formatPrice(stats.totalSpending)}</p><p className="text-sm opacity-50 mt-1">总花费</p></div>
          <div><p className="text-4xl font-bold text-emerald-400">{provinces.length}</p><p className="text-sm opacity-50 mt-1">个省份</p></div>
          <div><p className="text-4xl font-bold text-violet-400">{totalDays}</p><p className="text-sm opacity-50 mt-1">天在路上</p></div>
        </div>
      </div>
    )},
    { bg: 'from-emerald-900 via-teal-900 to-cyan-900', content: (
      <div className="text-center text-white">
        <p className="text-sm opacity-50 mb-4">你最活跃的月份</p>
        <p className="text-6xl font-bold text-amber-300 mb-2">{maxMonth.month ? `${parseInt(maxMonth.month.split('-')[1])}月` : '--'}</p>
        <p className="text-xl opacity-80">这个月你出行了 {maxMonth.count} 次</p>
      </div>
    )},
    { bg: 'from-orange-900 via-amber-900 to-yellow-900', content: (
      <div className="text-center text-white">
        <p className="text-sm opacity-50 mb-4">你的第一张车票</p>
        {earliestTicket ? (
          <>
            <p className="text-3xl font-bold mb-2">{earliestTicket.train_number}</p>
            <p className="text-xl">{earliestTicket.departure_station} → {earliestTicket.arrival_station}</p>
            <p className="text-sm opacity-60 mt-2">{earliestTicket.departure_date}</p>
          </>
        ) : <p className="text-xl opacity-60">还没有出行记录</p>}
      </div>
    )},
    { bg: 'from-violet-900 via-purple-900 to-fuchsia-900', content: (
      <div className="text-center text-white">
        <p className="text-sm opacity-50 mb-6">你点亮了这些省份</p>
        <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
          {provinces.map((p) => (
            <span key={p.name} className="px-3 py-1 bg-white/10 rounded-full text-sm">
              {p.name.replace(/省|市|自治区|壮族|回族|维吾尔/g, '')} ×{p.count}
            </span>
          ))}
        </div>
      </div>
    )},
    { bg: 'from-sky-900 via-blue-900 to-indigo-900', content: (
      <div className="text-center text-white">
        <p className="text-4xl font-bold mb-6">下一站，更精彩</p>
        <p className="text-lg opacity-60 mb-8">感谢 TickBook 陪伴你的每一段旅程</p>
        <Link to="/" className="inline-block px-6 py-2 bg-white/20 rounded-full text-white no-underline hover:bg-white/30 transition-colors">
          返回首页
        </Link>
      </div>
    )},
  ];

  const { bg, content } = SLIDES[slide];

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${bg} relative overflow-hidden`}>
      {/* 年份切换 */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 text-white">
        <button onClick={() => canPrev && setYear(availableYears[yearIdx + 1])}
          className="text-white/40 hover:text-white text-xl disabled:opacity-20">‹</button>
        <span className="text-lg font-medium">{year}</span>
        <button onClick={() => canNext && setYear(availableYears[yearIdx - 1])}
          className="text-white/40 hover:text-white text-xl disabled:opacity-20">›</button>
      </div>

      {/* 幻灯片导航 */}
      <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 text-4xl transition-colors">‹</button>
      <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 text-4xl transition-colors">›</button>

      {/* 进度点 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {SLIDES.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === slide ? 'bg-white' : 'bg-white/30'}`} />
        ))}
      </div>

      <div className="animate-fadeIn px-6">{content}</div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
      `}</style>
    </div>
  );
}
