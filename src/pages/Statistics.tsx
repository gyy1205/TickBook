import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTickets } from '../services/ticketService';
import { computeStatistics, type StatisticsData } from '../services/statistics';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

const TRAIN_GRADIENTS: Record<string, [string, string]> = {
  '高铁': ['#60a5fa', '#3b82f6'], '动车': ['#34d399', '#10b981'],
  '城际': ['#fbbf24', '#f59e0b'], '直达特快': ['#a78bfa', '#8b5cf6'],
  '特快': ['#f472b6', '#ec4899'], '快速': ['#f87171', '#ef4444'],
  '旅游专列': ['#22d3ee', '#06b6d4'], '临时旅客': ['#fb923c', '#f97316'],
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
          color="#2563eb" bg="bg-gradient-to-br from-blue-50 to-blue-100"
          trend={monthTrend ? (monthTrend.countDiff > 0 ? 'up' : monthTrend.countDiff < 0 ? 'down' : 'flat') : undefined}
          trendLabel={monthTrend ? `${Math.abs(monthTrend.countDiff)}张` : undefined}
        />
        <StatCard
          title="累计出行总花费" value={formatPrice(stats.totalSpending)} unit=""
          color="#d97706" bg="bg-gradient-to-br from-amber-50 to-amber-100"
          trend={monthTrend ? (monthTrend.spendDiff > 0 ? 'up' : monthTrend.spendDiff < 0 ? 'down' : 'flat') : undefined}
          trendLabel={monthTrend ? formatPrice(Math.abs(monthTrend.spendDiff)) : undefined}
        />
        <StatCard
          title="到访车站/城市" value={formatNumber(stats.stationCount)} unit="个"
          color="#059669" bg="bg-gradient-to-br from-emerald-50 to-emerald-100"
        />
        <StatCard
          title="累计乘车总时长" value={`${stats.totalDuration.hours}时${stats.totalDuration.minutes}分`} unit=""
          color="#7c3aed" bg="bg-gradient-to-br from-violet-50 to-violet-100"
        />
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 饼图 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-base font-medium text-gray-700 mb-3">列车种类消费占比</h2>
          {pieData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center">
              <ResponsiveContainer width="55%" height={260}>
                <PieChart>
                  <defs>
                    {pieData.map((d) => (
                      <linearGradient key={d.name} id={`pie-${d.name}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={(TRAIN_GRADIENTS[d.name] || ['#9ca3af', '#6b7280'])[0]} />
                        <stop offset="100%" stopColor={(TRAIN_GRADIENTS[d.name] || ['#9ca3af', '#6b7280'])[1]} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={pieData} cx="50%" cy="50%"
                    innerRadius={42} outerRadius={95}
                    paddingAngle={2} dataKey="value" label={false}
                  >
                    {pieData.map((d) => (
                      <Cell key={d.name} fill={`url(#pie-${d.name})`} stroke="none" />
                    ))}
                  </Pie>
                  <ReTooltip formatter={(v: any) => formatPrice(v)} />
                  {/* 中心总计 */}
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
                    className="text-xs fill-gray-400">总花费</text>
                  <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle"
                    className="text-sm font-bold fill-gray-800">{formatPrice(totalPie)}</text>
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-1.5 text-sm flex-shrink-0">
                {chartStats.byType.map((item) => (
                  <div key={item.type} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${(TRAIN_GRADIENTS[item.label] || ['#9ca3af','#6b7280']).join(',')})` }} />
                    <span className="text-gray-600">{item.label}</span>
                    <span className="text-gray-900 font-medium ml-auto">
                      {item.count}张 {formatPrice(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">暂无数据</p>
          )}
        </div>

        {/* 柱状图 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-base font-medium text-gray-700 mb-3">出行消费趋势</h2>
          {filteredByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
              <LineChart data={filteredByMonth} margin={{ top: 20, right: 45 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }}
                  tickFormatter={(v) => { const [y, m] = v.split('-'); return `${y.slice(2)}/${parseInt(m)}`; }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any, _n: any, p: any) =>
                  [formatPrice(v), `${p.payload.month}  ${p.payload.count}张`]} />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5}
                  dot={{ fill: '#3b82f6', r: 2.5 }}
                  activeDot={{ r: 6 }}
                  name="消费金额" />
                <ReferenceLine
                  y={filteredByMonth.reduce((s, m) => s + m.total, 0) / (filteredByMonth.length || 1)}
                  stroke="#f97316"
                  strokeDasharray="6 4"
                  strokeWidth={2.5}
                  label={{ value: '均值', position: 'right', fill: '#f97316', fontSize: 11 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">暂无数据</p>
          )}
        </div>
      </div>

      {/* 高频站点 — 横向条形图 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h2 className="text-base font-medium text-gray-700 mb-4">高频出行站点 TOP10</h2>
        {chartStats.topStations.length > 0 ? (
          <div className="space-y-2">
            {chartStats.topStations.map((s, i) => {
              const maxCount = chartStats.topStations[0].count;
              const pct = (s.count / maxCount) * 100;
              const barColors = [
                'bg-gradient-to-r from-[#93c5fd] to-[#60a5fa]',
                'bg-gradient-to-r from-[#6ee7b7] to-[#34d399]',
                'bg-gradient-to-r from-[#fcd34d] to-[#fbbf24]',
                'bg-gradient-to-r from-[#c4b5fd] to-[#a78bfa]',
                'bg-gradient-to-r from-[#f9a8d4] to-[#f472b6]',
              ];
              return (
                <div key={s.name} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${barColors[i] || 'bg-gradient-to-r from-gray-300 to-gray-400'}`}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700 w-20 flex-shrink-0">{s.name}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColors[i] || 'bg-gradient-to-r from-gray-300 to-gray-400'} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-10 text-right flex-shrink-0">{s.count}次</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">暂无数据</p>
        )}
      </div>

      {/* ===== 车次频次统计 ===== */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mt-6">
        <h2 className="text-base font-medium text-gray-700 mb-4">车次频次排行</h2>
        {chartStats.byTrainNumber.length > 0 ? (
          <div className="space-y-2">
            {chartStats.byTrainNumber.slice(0, 15).map((t, i) => {
              const maxCount = chartStats.byTrainNumber[0].count;
              const pct = (t.count / maxCount) * 100;
              const barColors = [
                'bg-gradient-to-r from-[#93c5fd] to-[#60a5fa]',
                'bg-gradient-to-r from-[#6ee7b7] to-[#34d399]',
                'bg-gradient-to-r from-[#fcd34d] to-[#fbbf24]',
                'bg-gradient-to-r from-[#c4b5fd] to-[#a78bfa]',
                'bg-gradient-to-r from-[#f9a8d4] to-[#f472b6]',
              ];
              return (
                <div key={t.name} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${barColors[i] || 'bg-gradient-to-r from-gray-300 to-gray-400'}`}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700 w-20 flex-shrink-0 font-mono">{t.name}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColors[i] || 'bg-gradient-to-r from-gray-300 to-gray-400'} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-10 text-right flex-shrink-0">{t.count}次</span>
                  {t.total > 0 && (
                    <span className="text-xs text-gray-400 w-16 text-right flex-shrink-0">¥{t.total.toFixed(0)}</span>
                  )}
                </div>
              );
            })}
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

      {/* ===== 坐席统计 ===== */}
      {chartStats && <SeatStats stats={chartStats} />}

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

function SeatStats({ stats }: { stats: StatisticsData }) {
  const [mode, setMode] = useState<SeatMode>('seat_position');
  const { seatPosition, emuSeat, berth } = stats;
  const allZero = (obj: object) => Object.values(obj).every((v) => v === 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mt-6">
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

function StatCard({ title, value, unit, color, bg, trend, trendLabel }: {
  title: string; value: string; unit: string; color: string; bg: string;
  trend?: 'up' | 'down' | 'flat';
  trendLabel?: string;
}) {
  return (
    <div className={`rounded-lg shadow-sm border border-gray-200 p-5 ${bg} hover:scale-[1.03] transition-transform duration-200`}>
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold" style={{ color }}>
          {value}
          {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
        </p>
        {trend && trendLabel && (
          <span className={`text-xs pb-1 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendLabel}
          </span>
        )}
      </div>
    </div>
  );
}
