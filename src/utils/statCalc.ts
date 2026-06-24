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

// 按车次号分组统计
export function groupByTrainNumber(
  tickets: Ticket[]
): { name: string; count: number; total: number }[] {
  const map = new Map<string, { count: number; total: number }>();
  tickets.forEach((t) => {
    if (!t.train_number) return;
    const name = t.train_number.trim();
    const entry = map.get(name) || { count: 0, total: 0 };
    entry.count++;
    if (t.price && t.price > 0) entry.total += t.price;
    map.set(name, entry);
  });
  return Array.from(map.entries())
    .map(([name, val]) => ({ name, ...val }))
    .sort((a, b) => b.count - a.count);
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

// ---- 坐席统计工具 ----

/** 提取座位号的字母部分（如 "12F" → "F"，纯数字 → ""） */
function seatLetter(seatNo: string): string {
  const m = seatNo.trim().match(/[A-Za-z]+$/);
  return m ? m[0].toUpperCase() : '';
}

/** 提取座位号的数字尾数（如 "12" → 2, "05" → 5） */
function seatEndDigit(seatNo: string): number | null {
  // 去掉字母后缀，取最后一位数字
  const numStr = seatNo.trim().replace(/[A-Za-z]+$/, '');
  if (!numStr) return null;
  const last = parseInt(numStr.slice(-1), 10);
  return isNaN(last) ? null : last;
}

export type SeatPosition = 'window' | 'aisle' | 'middle';

/** 判定座位是靠窗/过道/中间 */
export function classifySeatPosition(seatClass: string, seatNo: string): SeatPosition | null {
  if (!seatNo) return null;
  const letter = seatLetter(seatNo);
  const digit = seatEndDigit(seatNo);

  if (letter) {
    // 字母座位（动车组规则）
    if (letter === 'A' || letter === 'F') return 'window';
    if (letter === 'C' || letter === 'D') return 'aisle';
    if (letter === 'B') {
      // 一等座B:=靠过道，二等座B:=中间
      return seatClass === '一等座' ? 'aisle' : 'middle';
    }
    return 'middle';
  }

  if (digit !== null) {
    // 纯数字座位（普速列车）
    if ([0, 4, 5, 9].includes(digit)) return 'window';
    if ([2, 3, 7, 8].includes(digit)) return 'aisle';
    return 'middle';
  }

  return null;
}

export interface SeatPositionStats {
  window: number; aisle: number; middle: number; noseat: number;
}

/** 按靠窗/过道/中间分组统计 */
export function groupBySeatPosition(tickets: Ticket[]): SeatPositionStats {
  const result = { window: 0, aisle: 0, middle: 0, noseat: 0 };
  tickets.forEach((t) => {
    if (t.seat_class?.includes('无座') || t.seat_no?.includes('无座')) {
      result.noseat++;
      return;
    }
    const pos = classifySeatPosition(t.seat_class, t.seat_no);
    if (pos) result[pos]++;
  });
  return result;
}

export interface EMUSeatStats {
  A: number; B: number; C: number; D: number; F: number;
}

/** 按动车组坐席字母统计 A/B/C/D/F */
export function groupByEMUSeat(tickets: Ticket[]): EMUSeatStats {
  const result = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  tickets.forEach((t) => {
    const l = seatLetter(t.seat_no);
    if (l === 'A' || l === 'B' || l === 'C' || l === 'D' || l === 'F') {
      result[l]++;
    }
  });
  return result;
}

export interface BerthStats {
  upper: number; middle: number; lower: number;
}

/** 按铺位统计 上/中/下铺 */
export function groupByBerth(tickets: Ticket[]): BerthStats {
  const result = { upper: 0, middle: 0, lower: 0 };
  tickets.forEach((t) => {
    const sn = t.seat_no.trim();
    if (sn.includes('上')) result.upper++;
    else if (sn.includes('中')) result.middle++;
    else if (sn.includes('下')) result.lower++;
  });
  return result;
}
