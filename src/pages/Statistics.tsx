import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Train, MapPin, Armchair, Ticket, Coins, MapPinned, Clock } from 'lucide-react';
import { fetchTickets } from '../services/ticketService';
import { computeStatistics, type StatisticsData } from '../services/statistics';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Area,
} from 'recharts';

const TRAIN_GRADIENTS: Record<string, [string, string]> = {
  '高铁': ['#818cf8', '#6366f1'], '动车': ['#6ee7b7', '#10b981'],
  '城际': ['#fbbf24', '#f59e0b'], '直达特快': ['#a78bfa', '#8b5cf6'],
  '特快': ['#f472b6', '#ec4899'], '快速': ['#fb923c', '#f97316'],
  '旅游专列': ['#38bdf8', '#0ea5e9'], '临时旅客': ['#a8a29e', '#78716c'],
  '其他': ['#cbd5e1', '#94a3b8'],
};

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN');
}

function formatPrice(n: number): string {
  return '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Statistics() {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');

  const [allTickets, setAllTickets] = useState<any[]>([]);

  useEffect(() => {
    fetchTickets()
      .then((tickets) => {
        setAllTickets(tickets);
        setStats(computeStatistics(tickets));
      })
      .catch((err) => {
        console.error('加载数据失败:', err);
        setError('数据加载失败，请稍后重试');
      })
      .finally(() => setLoading(false));
  }, []);

  // 可用年份
  const availableYears = useMemo(() => {
    if (!stats) return [];
    const years = new Set(stats.byMonth.map((m) => m.month.substring(0, 4)));
    return Array.from(years).sort().reverse();
  }, [stats]);

  // 按年份过滤后的统计数据（卡片始终全量，图表跟随筛选）
  const filteredStats = useMemo(() => {
    if (!stats) return null;
    if (yearFilter === 'all') return stats;
    const filtered = allTickets.filter((t) =>
      t.departure_date && t.departure_date.startsWith(yearFilter)
    );
    return computeStatistics(filtered);
  }, [stats, allTickets, yearFilter]);

  // 防御：stats 已通过上方空态判断，此处必非 null
  const chartStats = filteredStats!;

  // 按年份过滤月度数据
  const filteredByMonth = useMemo(() => {
    return chartStats?.byMonth || [];
  }, [chartStats]);

  // 标签页
  const [tab, setTab] = useState<'overview' | 'train' | 'station' | 'seat'>('overview');
  const tabs = [
    { key: 'overview' as const, label: '总览', Icon: Eye },
    { key: 'train' as const, label: '车次', Icon: Train },
    { key: 'station' as const, label: '站点', Icon: MapPin },
    { key: 'seat' as const, label: '坐席', Icon: Armchair },
  ];

  // 月度趋势
  const monthTrend = useMemo(() => {
    if (!stats || stats.byMonth.length < 2) return null;
    const sorted = [...stats.byMonth].sort((a, b) => b.month.localeCompare(a.month));
    const curr = sorted[0];
    const prev = sorted[1];
    const spendDiff = curr.total - prev.total;
    const countDiff = curr.count - prev.count;
    return { spendDiff, countDiff };
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="text-blue-600 text-sm hover:underline">
          点击重试
        </button>
      </div>
    );
  }

  if (!stats || stats.totalCount === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg mb-4">暂无车票记录，快去添加你的第一张车票吧</p>
        <Link to="/tickets/new" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 no-underline">
          添加车票
        </Link>
      </div>
    );
  }

  const pieData = chartStats?.byType?.filter((d) => d.count > 0).map((d) => ({
    name: d.label,
    value: d.total,
    count: d.count,
  })) || [];
  const totalPie = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      {/* 标题 + 年份筛选 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-800">数据统计</h1>
        {availableYears.length > 1 && (
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">全部年份</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
        )}
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="总出行单据数" value={formatNumber(stats.totalCount)} unit="张"
          color="#2563eb" bg="bg-gradient-to-br from-blue-50 to-blue-100" Icon={Ticket}
          trend={monthTrend ? (monthTrend.countDiff > 0 ? 'up' : monthTrend.countDiff < 0 ? 'down' : 'flat') : undefined}
          trendLabel={monthTrend ? `${Math.abs(monthTrend.countDiff)}张` : undefined}
        />
        <StatCard
          title="累计出行总花费" value={formatPrice(stats.totalSpending)} unit=""
          color="#d97706" bg="bg-gradient-to-br from-amber-50 to-amber-100" Icon={Coins}
          trend={monthTrend ? (monthTrend.spendDiff > 0 ? 'up' : monthTrend.spendDiff < 0 ? 'down' : 'flat') : undefined}
          trendLabel={monthTrend ? formatPrice(Math.abs(monthTrend.spendDiff)) : undefined}
        />
        <StatCard
          title="到访车站/城市" value={formatNumber(stats.stationCount)} unit="个"
          color="#059669" bg="bg-gradient-to-br from-emerald-50 to-emerald-100" Icon={MapPinned}
        />
        <StatCard
          title="累计乘车总时长" value={`${stats.totalDuration.hours}时${stats.totalDuration.minutes}分`} unit=""
          color="#7c3aed" bg="bg-gradient-to-br from-violet-50 to-violet-100" Icon={Clock}
        />
      </div>

      {/* 标签页导航 */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* ===== 总览 ===== */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 饼图：列车种类消费占比 */}
          <div className="bg-white/75 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/60 p-5">
            <h2 className="text-base font-medium text-gray-700 mb-3">列车种类消费占比</h2>
            {pieData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center">
                <ResponsiveContainer width="55%" height={280}>
                  <PieChart>
                    <defs>
                      {pieData.map((d) => (
                        <linearGradient key={d.name} id={`pie-${d.name}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={(TRAIN_GRADIENTS[d.name] || ['#9ca3af', '#6b7280'])[0]} />
                          <stop offset="100%" stopColor={(TRAIN_GRADIENTS[d.name] || ['#9ca3af', '#6b7280'])[1]} />
                        </linearGradient>
                      ))}
                      {/* 柔化阴影 */}
                      <filter id="pieShadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#00000015" />
                      </filter>
                    </defs>
                    <Pie
                      data={pieData} cx="50%" cy="50%"
                      innerRadius={56} outerRadius={105}
                      paddingAngle={3} dataKey="value" label={false}
                      animationBegin={0} animationDuration={800} animationEasing="ease-out"
                    >
                      {pieData.map((d) => (
                        <Cell key={d.name} fill={`url(#pie-${d.name})`} stroke="#fff" strokeWidth={2} filter="url(#pieShadow)" />
                      ))}
                    </Pie>
                    <ReTooltip formatter={(v: any) => formatPrice(v)} />
                    <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle"
                      className="text-[13px] fill-gray-400 font-medium">总花费</text>
                    <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle"
                      className="text-[15px] font-bold fill-gray-800 tracking-tight">{formatPrice(totalPie)}</text>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 text-sm flex-shrink-0">
                  {chartStats.byType.map((item) => {
                    const pct = totalPie > 0 ? ((pieData.find(d => d.name === item.label)?.value || 0) / totalPie * 100).toFixed(1) : '0';
                    return (
                      <div key={item.type} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                          style={{ background: `linear-gradient(135deg, ${(TRAIN_GRADIENTS[item.label] || ['#9ca3af','#6b7280']).join(',')})` }} />
                        <span className="text-gray-600">{item.label}</span>
                        <span className="text-gray-400 text-xs ml-auto">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">暂无数据</p>
            )}
          </div>

          {/* 月度消费趋势 */}
          <div className="bg-white/75 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/60 p-5">
            <h2 className="text-base font-medium text-gray-700 mb-3">出行消费趋势</h2>
            {filteredByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredByMonth} margin={{ top: 20, right: 45 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.24} />
                      <stop offset="50%" stopColor="#6366f1" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.01} />
                    </linearGradient>
                    <filter id="lineGlow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => { const [y, m] = v.split('-'); return `${y.slice(2)}/${parseInt(m)}`; }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    formatter={(v: any, _n: any, p: any) =>
                      [formatPrice(v), `${p.payload.month}  ${p.payload.count}张`]} />
                  <Area type="monotone" dataKey="total" fill="url(#areaGradient)" stroke="none" />
                  <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5}
                    dot={{ fill: '#6366f1', r: 3 }}
                    activeDot={{ r: 7, fill: '#6366f1' }}
                    name="消费金额" />
                  <ReferenceLine
                    y={filteredByMonth.reduce((s, m) => s + m.total, 0) / (filteredByMonth.length || 1)}
                    stroke="#f97316"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: '均值', position: 'right', fill: '#f97316', fontSize: 11, fontWeight: 600 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">暂无数据</p>
            )}
          </div>
        </div>
      )}

      {/* ===== 车次 ===== */}
      {tab === 'train' && (
        <div className="space-y-6">
          <div className="bg-white/75 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/60 p-5">
            <h2 className="text-base font-medium text-gray-700 mb-4">车次频次排行</h2>
            {chartStats.byTrainNumber.length > 0 ? (
              <div className="space-y-1">
                {chartStats.byTrainNumber.slice(0, 15).map((t, i) => (
                  <RankBar key={t.name} rank={i + 1} label={t.name} count={t.count} maxCount={chartStats.byTrainNumber[0].count}
                    suffix={t.total > 0 ? `¥${t.total.toFixed(0)}` : undefined} mono />
                ))}
                {chartStats.byTrainNumber.length > 15 && (
                  <p className="text-xs text-gray-400 text-center pt-1">
                    还有 {chartStats.byTrainNumber.length - 15} 个车次未显示
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">暂无车次数据</p>
            )}
          </div>
        </div>
      )}

      {/* ===== 站点 ===== */}
      {tab === 'station' && (
        <div className="bg-white/75 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/60 p-5">
          <h2 className="text-base font-medium text-gray-700 mb-4">高频出行站点 TOP10</h2>
          {chartStats.topStations.length > 0 ? (
            <div className="space-y-1">
              {chartStats.topStations.map((s, i) => (
                <RankBar key={s.name} rank={i + 1} label={s.name} count={s.count} maxCount={chartStats.topStations[0].count} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">暂无数据</p>
          )}
        </div>
      )}

      {/* ===== 坐席 ===== */}
      {tab === 'seat' && chartStats && <SeatStats stats={chartStats} noMargin />}

    </div>
  );
}

// ===== 坐席统计组件 =====
const SEAT_MODES = ['seat_position', 'emu_seat', 'berth'] as const;
type SeatMode = (typeof SEAT_MODES)[number];
const SEAT_LABELS: Record<SeatMode, string> = {
  seat_position: '靠窗/过道/中间',
  emu_seat: '动车组坐席',
  berth: '铺位',
};

function SeatStats({ stats, noMargin }: { stats: StatisticsData; noMargin?: boolean }) {
  const [mode, setMode] = useState<SeatMode>('seat_position');
  const { seatPosition, emuSeat, berth } = stats;
  const allZero = (obj: object) => Object.values(obj).every((v) => v === 0);

  return (
    <div className={`bg-white/75 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/60 p-5 ${noMargin ? '' : 'mt-6'}`}>
      <h2 className="text-base font-medium text-gray-700 mb-4">坐席统计</h2>

      {/* 模式切换 */}
      <div className="flex gap-2 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {(Object.entries(SEAT_LABELS) as [SeatMode, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 靠窗/过道/中间 */}
      {mode === 'seat_position' && (
        !allZero(seatPosition) ? (
          <div className="grid grid-cols-4 gap-4">
            <SeatCard label="靠窗" count={seatPosition.window}
              total={seatPosition.window + seatPosition.aisle + seatPosition.middle + seatPosition.noseat} color="from-emerald-400 to-emerald-600" />
            <SeatCard label="过道" count={seatPosition.aisle}
              total={seatPosition.window + seatPosition.aisle + seatPosition.middle + seatPosition.noseat} color="from-blue-400 to-blue-600" />
            <SeatCard label="中间" count={seatPosition.middle}
              total={seatPosition.window + seatPosition.aisle + seatPosition.middle + seatPosition.noseat} color="from-amber-400 to-amber-600" />
            <SeatCard label="无座" count={seatPosition.noseat}
              total={seatPosition.window + seatPosition.aisle + seatPosition.middle + seatPosition.noseat} color="from-gray-400 to-gray-600" />
          </div>
        ) : <p className="text-gray-400 text-sm text-center py-6">暂无坐席数据</p>
      )}

      {/* 动车组坐席 A/B/C/D/F */}
      {mode === 'emu_seat' && (() => {
        const emuTotal = Object.values(emuSeat).reduce((a, b) => a + b, 0);
        return !allZero(emuSeat) ? (
          <div className="grid grid-cols-5 gap-3">
            {(['A','B','C','D','F'] as const).map((l) => (
              <div key={l} className="text-center bg-gray-50 rounded-lg p-3">
                <span className="text-2xl font-bold text-gray-800">{emuSeat[l]}</span>
                <p className="text-xs text-gray-400 mt-1">{l}座</p>
                {emuTotal > 0 && <p className="text-xs text-gray-400">{((emuSeat[l] / emuTotal) * 100).toFixed(1)}%</p>}
              </div>
            ))}
          </div>
        ) : <p className="text-gray-400 text-sm text-center py-6">暂无动车组坐席数据</p>;
      })()}

      {/* 铺位 上/中/下 */}
      {mode === 'berth' && (
        !allZero(berth) ? (
          <div className="grid grid-cols-3 gap-4">
            <SeatCard label="上铺" count={berth.upper}
              total={berth.upper + berth.middle + berth.lower} color="from-violet-400 to-violet-600" />
            <SeatCard label="中铺" count={berth.middle}
              total={berth.upper + berth.middle + berth.lower} color="from-pink-400 to-pink-600" />
            <SeatCard label="下铺" count={berth.lower}
              total={berth.upper + berth.middle + berth.lower} color="from-orange-400 to-orange-600" />
          </div>
        ) : <p className="text-gray-400 text-sm text-center py-6">暂无铺位数据</p>
      )}
    </div>
  );
}

function SeatCard({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
  return (
    <div className="text-center rounded-lg p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <p className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{count}</p>
      <p className="text-xs text-gray-400">{pct}%</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

// 排行条目渐变色系
const RANK_ORANGE = { bar: 'from-amber-400 via-orange-400 to-orange-500', badge: 'from-amber-500 to-orange-600', glow: '#f97316' };
const RANK_GRAY = { bar: 'from-slate-300 to-gray-400', badge: 'from-slate-400 to-gray-500', glow: '#94a3b8' };

function RankBar({ rank, label, count, maxCount, suffix, mono }: {
  rank: number; label: string; count: number; maxCount: number; suffix?: string; mono?: boolean;
}) {
  const pct = (count / maxCount) * 100;
  const c = rank <= 5 ? RANK_ORANGE : RANK_GRAY;
  return (
    <div className="flex items-center gap-3 rank-bar-group py-0.5">
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 bg-gradient-to-br ${c.badge} shadow-sm`}>
        {rank}
      </span>
      <span className={`text-sm text-gray-700 w-20 flex-shrink-0 truncate ${mono ? 'font-mono font-medium' : ''}`}>{label}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${c.bar} relative overflow-hidden transition-[width] duration-700 ease-out`}
          style={{ width: `${pct}%`, boxShadow: `0 0 6px ${c.glow}40` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 rank-shimmer" />
        </div>
      </div>
      <span className="text-sm font-semibold text-gray-600 w-10 text-right flex-shrink-0 tabular-nums">{count}次</span>
      {suffix && <span className="text-xs text-gray-400 w-14 text-right flex-shrink-0 tabular-nums">{suffix}</span>}
    </div>
  );
}

function StatCard({ title, value, unit, color, bg, Icon, trend, trendLabel }: {
  title: string; value: string; unit: string; color: string; bg: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  trend?: 'up' | 'down' | 'flat';
  trendLabel?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl shadow-sm border border-gray-200/60 ${bg} hover:shadow-md transition-shadow duration-300`}>
      {/* 左侧色条 */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />
      <div className="p-5 pl-6">
        <div className="flex items-center gap-2 mb-3">
          <Icon size={18} style={{ color }} />
          <p className="text-sm text-gray-500">{title}</p>
        </div>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-bold" style={{ color }}>
            {value}
            {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
          </p>
          {trend && trendLabel && (
            <span className={`text-xs pb-1 font-medium ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
