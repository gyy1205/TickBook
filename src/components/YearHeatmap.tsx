import { useMemo } from 'react';

interface Props {
  tickets: { departure_date: string }[];
  year: number;
  onYearChange: (y: number) => void;
  availableYears: number[];
}

// 按日期统计出行次数
function countByDate(tickets: { departure_date: string }[], year: number): Map<string, number> {
  const map = new Map<string, number>();
  tickets.forEach((t) => {
    if (!t.departure_date) return;
    const [y] = t.departure_date.split('-');
    if (y === String(year)) {
      map.set(t.departure_date, (map.get(t.departure_date) || 0) + 1);
    }
  });
  return map;
}

// 颜色分三档
function heatColor(count: number): string {
  if (count === 0) return '#e5e7eb';       // 灰
  if (count === 1) return '#fed7aa';        // 浅橘
  if (count === 2) return '#fb923c';        // 中橘
  return '#ea580c';                          // 深橘
}

export default function YearHeatmap({ tickets, year, onYearChange, availableYears }: Props) {
  const dateCount = useMemo(() => countByDate(tickets, year), [tickets, year]);

  // 生成全年日期并按列（周）排列
  const { grid, monthPositions } = useMemo(() => {
    const firstDay = new Date(year, 0, 1);
    const lastDay = new Date(year, 11, 31);
    const totalDays = Math.ceil((lastDay.getTime() - firstDay.getTime()) / 86400000) + 1;

    // 补到整周：周日(0)开头
    const startOffset = firstDay.getDay(); // 0=Sun
    const cols = Math.ceil((totalDays + startOffset) / 7);
    const grid: (string | null)[][] = Array.from({ length: 7 }, () => Array(cols).fill(null));

    const monthPos: { month: number; col: number }[] = [];
    let lastMonth = -1;

    for (let d = 0; d < totalDays; d++) {
      const date = new Date(year, 0, 1 + d);
      const month = date.getMonth();
      const dayOfWeek = date.getDay();
      const col = Math.floor((d + startOffset) / 7);
      const dateStr = `${date.getFullYear()}-${String(month + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      grid[dayOfWeek][col] = dateStr;

      if (month !== lastMonth && [0, 3, 6, 9].includes(month)) {
        monthPos.push({ month, col });
      }
      lastMonth = month;
    }

    return { grid, monthPositions: monthPos };
  }, [year]);

  const canPrev = availableYears.some((y) => y < year);
  const canNext = availableYears.some((y) => y > year);

  const MONTH_LABELS = ['1月', '4月', '7月', '10月'];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mt-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-gray-700">年度出行热力图</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => canPrev && onYearChange(year - 1)}
            disabled={!canPrev}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-default text-lg leading-none"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-gray-700 w-12 text-center">{year}</span>
          <button
            onClick={() => canNext && onYearChange(year + 1)}
            disabled={!canNext}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-default text-lg leading-none"
          >
            ›
          </button>
        </div>
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-400">
        <span>少</span>
        {['#e5e7eb', '#fed7aa', '#fb923c', '#ea580c'].map((c) => (
          <span key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
        ))}
        <span>多</span>
      </div>

      {/* 热力图主体 */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-[2px] min-w-full">
          {/* 月份标注行 */}
          <div className="flex gap-[2px]" style={{ paddingLeft: 0 }}>
            {Array.from({ length: (grid[0]?.length || 0) }).map((_, col) => {
              const mp = monthPositions.find((m) => m.col === col);
              return (
                <div key={col} className="text-[10px] text-gray-400" style={{ width: 13, flexShrink: 0, overflow: 'visible', whiteSpace: 'nowrap' }}>
                  {mp ? MONTH_LABELS[[0, 3, 6, 9].indexOf(mp.month)] : ''}
                </div>
              );
            })}
          </div>
          {/* 方格行 */}
          {grid.map((row, r) => (
            <div key={r} className="flex gap-[2px]">
              {row.map((dateStr, c) => {
                const count = dateStr ? (dateCount.get(dateStr) || 0) : 0;
                const color = heatColor(dateStr ? count : -1);
                return (
                  <div
                    key={c}
                    className="rounded-sm flex-shrink-0"
                    style={{ width: 13, height: 13, backgroundColor: dateStr ? color : 'transparent' }}
                    title={dateStr ? `${dateStr} · ${count}次` : ''}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
