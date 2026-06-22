import type { Ticket } from '../types';
import stationData from '../../stations_data.json';

// 构建站名 → 省份 / 城市 映射
type StationInfo = { station_name: string; city: string | null; province: string | null };
const stations: StationInfo[] = stationData.raw;

const stationProvinceMap = new Map<string, string>();
const stationCityMap = new Map<string, string>();

stations.forEach((s) => {
  const nameWith = s.station_name.trim();          // "北京北站"
  const nameWithout = nameWith.replace(/站$/, '');  // "北京北"
  if (s.province) {
    stationProvinceMap.set(nameWith, s.province);
    stationProvinceMap.set(nameWithout, s.province);
  }
  if (s.city) {
    stationCityMap.set(nameWith, s.city);
    stationCityMap.set(nameWithout, s.city);
  }
});

// 城市名 → 省份（用于城市模式下获取省份编码）
const cityProvinceMap = new Map<string, string>();
stations.forEach((s) => {
  if (s.city && s.province && !cityProvinceMap.has(s.city)) {
    cityProvinceMap.set(s.city, s.province);
  }
});

/** 站名 → 省份 */
export function stationToProvince(stationName: string): string | null {
  if (!stationName) return null;
  const clean = stationName.trim();
  return stationProvinceMap.get(clean) || stationProvinceMap.get(clean.replace(/站$/, '')) || null;
}

/** 站名 → 城市 */
export function stationToCity(stationName: string): string | null {
  if (!stationName) return null;
  const clean = stationName.trim();
  return stationCityMap.get(clean) || stationCityMap.get(clean.replace(/站$/, '')) || null;
}

/** 城市名 → 省份 */
export function cityToProvince(cityName: string): string | null {
  return cityProvinceMap.get(cityName) || null;
}

// ---- 省份编码 ----
export const PROVINCE_CODES: Record<string, string> = {
  '北京市': '110000', '天津市': '120000', '上海市': '310000', '重庆市': '500000',
  '河北省': '130000', '山西省': '140000', '辽宁省': '210000', '吉林省': '220000', '黑龙江省': '230000',
  '江苏省': '320000', '浙江省': '330000', '安徽省': '340000', '福建省': '350000', '江西省': '360000', '山东省': '370000',
  '河南省': '410000', '湖北省': '420000', '湖南省': '430000', '广东省': '440000', '广西壮族自治区': '450000', '海南省': '460000',
  '四川省': '510000', '贵州省': '520000', '云南省': '530000', '西藏自治区': '540000',
  '陕西省': '610000', '甘肃省': '620000', '青海省': '630000', '宁夏回族自治区': '640000', '新疆维吾尔自治区': '650000',
  '内蒙古自治区': '150000',
  '香港特别行政区': '810000', '澳门特别行政区': '820000', '台湾省': '710000',
};

export interface ProvinceVisit {
  name: string;
  count: number;
  stations: string[];
  total: number;
}

export function computeProvinceVisits(tickets: Ticket[]): ProvinceVisit[] {
  const map = new Map<string, { count: number; stations: Set<string>; total: number }>();

  tickets.forEach((t) => {
    [t.departure_station, t.arrival_station].forEach((s) => {
      const prov = stationToProvince(s);
      if (!prov) return;
      const entry = map.get(prov) || { count: 0, stations: new Set(), total: 0 };
      entry.count++;
      entry.stations.add(s);
      if (t.price) entry.total += t.price;
      map.set(prov, entry);
    });
  });

  return Array.from(map.entries())
    .map(([name, val]) => ({
      name,
      count: val.count,
      stations: Array.from(val.stations),
      total: val.total,
    }))
    .sort((a, b) => b.count - a.count);
}

export const ALL_PROVINCES = [
  '北京市', '天津市', '上海市', '重庆市',
  '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
  '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '海南省',
  '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省',
  '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区',
  '香港特别行政区', '澳门特别行政区', '台湾省',
];
