import type { Ticket } from '../types';

// 金额求和（过滤空价格和0）
export function sumPrice(tickets: Ticket[]): number {
  return tickets
    .filter((t) => t.price && t.price > 0)
    .reduce((sum, t) => sum + t.price, 0);
}

// 单趟乘车时长计算（分钟），支持跨天
export function calcDurationMinutes(
  departureTime: string,
  arrivalTime: string
): number | null {
  if (!departureTime || !arrivalTime) return null;

  const [dh, dm] = departureTime.split(':').map(Number);
  const [ah, am] = arrivalTime.split(':').map(Number);
  if (isNaN(dh) || isNaN(dm) || isNaN(ah) || isNaN(am)) return null;

  let depMinutes = dh * 60 + dm;
  let arrMinutes = ah * 60 + am;

  // 到达时间早于出发时间 → 跨天
  if (arrMinutes < depMinutes) {
    arrMinutes += 24 * 60;
  }

  return arrMinutes - depMinutes;
}

// 累加总乘车时长，返回 { hours, minutes }
export function calcTotalDuration(tickets: Ticket[]): {
  hours: number;
  minutes: number;
} {
  const totalMinutes = tickets.reduce((sum, t) => {
    const m = calcDurationMinutes(t.departure_time, t.arrival_time);
    return sum + (m ?? 0);
  }, 0);

  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

// 站点去重统计
export function countUniqueStations(tickets: Ticket[]): {
  count: number;
  stations: string[];
} {
  const set = new Set<string>();
  tickets.forEach((t) => {
    if (t.departure_station) set.add(t.departure_station);
    if (t.arrival_station) set.add(t.arrival_station);
  });
  return { count: set.size, stations: [...set] };
}

// 按月份分组统计
export function groupByMonth(
  tickets: Ticket[]
): { month: string; count: number; total: number }[] {
  const map = new Map<string, { count: number; total: number }>();

  tickets.forEach((t) => {
    if (!t.departure_date) return;
    const month = t.departure_date.substring(0, 7); // "2026-06"
    const entry = map.get(month) || { count: 0, total: 0 };
    entry.count++;
    if (t.price && t.price > 0) entry.total += t.price;
    map.set(month, entry);
  });

  return Array.from(map.entries())
    .map(([month, val]) => ({ month, ...val }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// 车次字母 → 列车种类
const TRAIN_CLASS_MAP: Record<string, string> = {
  G: '高铁',
  D: '动车',
  C: '城际',
  K: '快速',
  Z: '直达特快',
  T: '特快',
  Y: '旅游专列',
  L: '临时旅客',
};

export function classifyTrain(trainNumber: string): string {
  const prefix = trainNumber.trim().charAt(0).toUpperCase();
  return TRAIN_CLASS_MAP[prefix] || '其他';
}

// 按列车种类分组：{ label, count, total }
export function groupByTrainClass(
  tickets: Ticket[]
): { type: string; label: string; count: number; total: number }[] {
  const map = new Map<string, { count: number; total: number }>();

  tickets.forEach((t) => {
    const label = classifyTrain(t.train_number);
    const entry = map.get(label) || { count: 0, total: 0 };
    entry.count++;
    if (t.price && t.price > 0) entry.total += t.price;
    map.set(label, entry);
  });

  // 自定义排序：高铁→动车→城际→直达→特快→快速→旅游→临客→其他
  const order = ['高铁', '动车', '城际', '直达特快', '特快', '快速', '旅游专列', '临时旅客', '其他'];
  return Array.from(map.entries())
    .map(([label, val]) => ({ type: label, label, ...val }))
    .sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
}

// 高频站点 TOP N
export function topStations(
  tickets: Ticket[],
  n: number = 10
): { name: string; count: number }[] {
  const freq = new Map<string, number>();
  tickets.forEach((t) => {
    if (t.departure_station)
      freq.set(t.departure_station, (freq.get(t.departure_station) || 0) + 1);
    if (t.arrival_station)
      freq.set(t.arrival_station, (freq.get(t.arrival_station) || 0) + 1);
  });

  return Array.from(freq.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}
