import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTickets } from '../services/ticketService';
import { computeStatistics, type StatisticsData } from '../services/statistics';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

const TRAIN_COLORS: Record<string, string> = {
  '高铁': '#2563eb',
  '动车': '#059669',
  '城际': '#d97706',
  '直达特快': '#7c3aed',
  '特快': '#db2777',
  '快速': '#dc2626',
  '旅游专列': '#0891b2',
  '临时旅客': '#ea580c',
  '其他': '#6b7280',
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

  useEffect(() => {
    fetchTickets()
      .then((tickets) => setStats(computeStatistics(tickets)))
      .catch((err) => {
        console.error('加载数据失败:', err);
        setError('数据加载失败，请稍后重试');
      })
      .finally(() => setLoading(false));
  }, []);

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

  const pieData = stats.byType.map((d) => ({
    name: d.label,
    value: d.total,
    count: d.count,
  }));

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">数据统计</h1>

      {/* 4大核心指标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="总出行单据数" value={formatNumber(stats.totalCount)} unit="张"
          color="#2563eb" icon="📋" />
        <StatCard title="累计出行总花费" value={formatPrice(stats.totalSpending)} unit=""
          color="#d97706" icon="💰" />
        <StatCard title="到访车站/城市" value={formatNumber(stats.stationCount)} unit="个"
          color="#059669" icon="📍" />
        <StatCard title="累计乘车总时长" value={`${stats.totalDuration.hours}时${stats.totalDuration.minutes}分`} unit=""
          color="#7c3aed" icon="⏱️" />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 列车种类消费占比 — 饼图 + 图例 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-base font-medium text-gray-700 mb-3">列车种类消费占比</h2>
          {pieData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center">
              <ResponsiveContainer width="55%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={40} outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={false}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={TRAIN_COLORS[entry.name] || '#9ca3af'} />
                    ))}
                  </Pie>
                  <ReTooltip formatter={(v: any) => formatPrice(v)} />
                </PieChart>
              </ResponsiveContainer>

              {/* 右侧文字列表 */}
              <div className="space-y-1.5 text-sm flex-shrink-0">
                {stats.byType.map((item) => (
                  <div key={item.type} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: TRAIN_COLORS[item.label] || '#9ca3af' }} />
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

        {/* 按月消费 — 柱状图 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-base font-medium text-gray-700 mb-3">按月出行消费</h2>
          {stats.byMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byMonth} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => {
                    const [y, m] = v.split('-');
                    return `${y}年${parseInt(m)}月`;
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: any, _name: any, props: any) => [
                    formatPrice(v),
                    `${props.payload.month} (${props.payload.count}张)`,
                  ]}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={32}
                  fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">暂无数据</p>
          )}
        </div>
      </div>

      {/* 高频站点 TOP10 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h2 className="text-base font-medium text-gray-700 mb-4">高频出行站点 TOP10</h2>
        {stats.topStations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {stats.topStations.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-400' : i === 2 ? 'bg-amber-400' : 'bg-gray-300'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700">{s.name}</span>
                </div>
                <span className="text-sm text-gray-400">{s.count} 次</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">暂无数据</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, unit, color, icon }: {
  title: string; value: string; unit: string; color: string; icon: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-gray-500">{title}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
        {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
      </p>
    </div>
  );
}
