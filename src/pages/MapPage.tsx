import { useEffect, useRef, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import { fetchTickets } from '../services/ticketService';
import {
  computeProvinceVisits, ALL_PROVINCES, PROVINCE_CODES, stationToCity,
  type ProvinceVisit,
} from '../utils/stationMap';
import YearHeatmap from '../components/YearHeatmap';

const GEO_BASE = import.meta.env.BASE_URL + 'geo/';
const PROV_GEO_URL = GEO_BASE + '100000_full.json';
const CITY_GEO_BASE = GEO_BASE;

type MapMode = 'province' | 'city';

export default function MapPage() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [visits, setVisits] = useState<ProvinceVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [selectedProv, setSelectedProv] = useState<ProvinceVisit | null>(null);
  const [mode, setMode] = useState<MapMode>('province');
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [heatYear, setHeatYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchTickets()
      .then((tickets) => {
        setAllTickets(tickets);
        setVisits(computeProvinceVisits(tickets));
      })
      .finally(() => setLoading(false));
  }, []);

  // 城市级统计（直接从票据计算，含真实价格）
  const cityVisits = useMemo(() => {
    const map = new Map<string, { count: number; stations: Set<string>; total: number }>();
    allTickets.forEach((t) => {
      [t.departure_station, t.arrival_station].forEach((s: string) => {
        const city = stationToCity(s);
        if (!city) return;
        const entry = map.get(city) || { count: 0, stations: new Set(), total: 0 };
        entry.count++;
        entry.stations.add(s);
        if (t.price && t.price > 0) entry.total += t.price;
        map.set(city, entry);
      });
    });
    return Array.from(map.entries()).map(([name, v]) => ({ name, count: v.count, stations: [...v.stations], total: v.total }));
  }, [allTickets]);

  useEffect(() => {
    if (loading || !chartRef.current) return;
    const chart = echarts.init(chartRef.current);

    const loadMap = async () => {
      setMapLoading(true);
      try {
        if (mode === 'province') {
          const geo = await fetch(PROV_GEO_URL).then((r) => r.json());
          echarts.registerMap('china_map', geo);
          renderProvinceMap(chart);
        } else {
          // 城市模式：加载全部省份的城市 GeoJSON 并合并为全国市级地图
          const MUNICIPALITIES = new Set(['北京市', '天津市', '上海市', '重庆市']);
          let cached = window['__cityGeoJsonCache_v2' as any] as any;
          if (!cached) {
            const geos = await Promise.all(
              Object.entries(PROVINCE_CODES).map(async ([prov, code]) => {
                const geo = await fetch(`${CITY_GEO_BASE}${code}_full.json`).then((r) => r.json()).catch(() => null);
                // 直辖市：将多个区的 geometry 合并为一个 MultiPolygon，避免各区分别渲染造成重叠
                if (geo?.features && MUNICIPALITIES.has(prov) && geo.features.length > 0) {
                  const polygons: any[] = [];
                  geo.features.forEach((f: any) => {
                    if (f.geometry?.type === 'Polygon') {
                      polygons.push(f.geometry.coordinates);
                    } else if (f.geometry?.type === 'MultiPolygon') {
                      polygons.push(...f.geometry.coordinates);
                    }
                  });
                  if (polygons.length > 0) {
                    geo.features = [{
                      type: 'Feature',
                      properties: { name: prov },
                      geometry: { type: 'MultiPolygon', coordinates: polygons }
                    }];
                  }
                }
                return geo;
              })
            );
            const allFeatures: any[] = [];
            geos.forEach((g) => { if (g?.features) allFeatures.push(...g.features); });
            cached = { type: 'FeatureCollection', features: allFeatures };
            window['__cityGeoJsonCache_v2' as any] = cached;
          }
          echarts.registerMap('china_city_map', cached as any);
          renderCityMap(chart);
        }
      } catch (e) {
        console.error('地图加载失败', e);
      }
      setMapLoading(false);
    };

    loadMap();

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      chart.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, [loading, visits, mode]);

  function renderProvinceMap(chart: echarts.ECharts) {
    const visitedNames = new Set(visits.map((v) => v.name));
    const mapData = ALL_PROVINCES.map((name) => ({
      name,
      value: visitedNames.has(name) ? 1 : 0,
      visit: visits.find((v) => v.name === name),
    }));
    chart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const v = params.data?.visit;
          if (!v) return `${params.name}<br/>暂未到访`;
          return `<b>${v.name}</b><br/>到访 ${v.count} 次<br/>站点：${v.stations.join('、')}<br/>消费 ¥${v.total.toFixed(2)}`;
        },
      },
      visualMap: { min: 0, max: 1, show: false, inRange: { color: ['#e5e7eb', '#3b82f6'] } },
      series: [{
        type: 'map', map: 'china_map', roam: false,
        itemStyle: { areaColor: '#e5e7eb', borderColor: '#fff', borderWidth: 1 },
        emphasis: { itemStyle: { areaColor: '#fbbf24',  }, label: { show: true, color: '#333' } },
        data: mapData,
      }],
    }, true);
    chart.resize();
    chart.off('click');
    chart.on('click', (params: any) => setSelectedProv(params.data?.visit || null));
  }

  function renderCityMap(chart: echarts.ECharts) {
    const features = (echarts.getMap('china_city_map') as any)?.geoJSON?.features || [];
    const cityNames = new Set<string>();
    features.forEach((f: any) => {
      const n = f.properties?.name || '';
      if (n) cityNames.add(n);
    });

    const mapData: any[] = [];
    const seenNames = new Set<string>();
    cityNames.forEach((geoName) => {
      if (seenNames.has(geoName)) return;
      seenNames.add(geoName);
      // JSON 中城市名多为"南京"不含"市"，GeoJSON 多为"南京市"
      let cv = cityVisits.find((c) => c.name === geoName);
      if (!cv) cv = cityVisits.find((c) => c.name + '市' === geoName);
      if (!cv) cv = cityVisits.find((c) => c.name === geoName.replace(/市$/, ''));
      mapData.push({ name: geoName, value: cv ? 1 : 0, visit: cv || null });
    });

    chart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const v = params.data?.visit;
          if (!v) return `${params.name}<br/>暂未到访`;
          return `<b>${v.name}</b><br/>到访 ${v.count} 次<br/>站点：${v.stations.join('、')}<br/>消费 ¥${v.total.toFixed(2)}`;
        },
      },
      visualMap: { min: 0, max: 1, show: false, inRange: { color: ['#e5e7eb', '#3b82f6'] } },
      series: [{
        type: 'map', map: 'china_city_map', roam: false,
        label: { show: false },
        hoverAnimation: false,
        itemStyle: { areaColor: '#e5e7eb', borderColor: '#fff', borderWidth: 0.5 },
        emphasis: { itemStyle: { areaColor: '#fbbf24' }, label: { show: false } },
        data: mapData,
      }],
    }, true);
    chart.resize();
    chart.off('click');
    chart.on('click', (params: any) => setSelectedProv(params.data?.visit || null));
  }

  const heatmapYears = useMemo(() => {
    const years = [...new Set(allTickets.filter((t: any) => t.departure_date).map((t: any) => parseInt(t.departure_date.substring(0, 4))))] as number[];
    return years.sort((a, b) => a - b);
  }, [allTickets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">足迹地图</h1>
          <p className="text-sm text-gray-400 mt-1">
            已点亮 {mode === 'province' ? `${visits.length} 个省份` : `${cityVisits.length} 个城市`} · 点击地图查看详情
          </p>
        </div>
        {/* 省/市切换 */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['province', 'city'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              disabled={mapLoading}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m === 'province' ? '省级' : '市级'}
            </button>
          ))}
        </div>
      </div>

      {/* 地图 */}
      <div className="relative bg-white/75 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/60 w-full" style={{ height: 600 }}>
        {mapLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        )}
        <div ref={chartRef} className="w-full h-full" />
      </div>

      {/* 选中详情 */}
      {selectedProv && (
        <div className="mt-4 bg-white/75 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/60 p-4">
          <h3 className="font-medium text-gray-800 mb-2">{selectedProv.name}</h3>
          <div className="text-sm text-gray-500 space-y-1">
            <p>到访 {selectedProv.count} 次 · 累计消费 ¥{selectedProv.total.toFixed(2)}</p>
            <p>站点：{selectedProv.stations.join('、')}</p>
          </div>
        </div>
      )}

      {/* 列表 */}
      <div className="mt-6 bg-white/75 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/60 p-5">
        <h2 className="text-base font-medium text-gray-700 mb-3">
          到访{mode === 'province' ? '省份' : '城市'}
        </h2>
        {visits.length > 0 ? (
          <div className="space-y-2">
            {(() => {
              const list = (mode === 'province' ? visits : cityVisits)
                .slice() // 防御性拷贝
                .sort((a, b) => b.count - a.count); // 次数从多到少
              const maxCount = list[0]?.count || 1;
              const BAR_COLORS = [
                'bg-gradient-to-r from-[#93c5fd] to-[#60a5fa]',
                'bg-gradient-to-r from-[#6ee7b7] to-[#34d399]',
                'bg-gradient-to-r from-[#fcd34d] to-[#fbbf24]',
                'bg-gradient-to-r from-[#c4b5fd] to-[#a78bfa]',
                'bg-gradient-to-r from-[#f9a8d4] to-[#f472b6]',
              ];
              return list.map((v, i) => {
                const pct = maxCount > 0 ? (v.count / maxCount) * 100 : 0;
                const color = i < BAR_COLORS.length ? BAR_COLORS[i] : 'bg-gradient-to-r from-gray-300 to-gray-400';
                return (
                  <button
                    key={v.name}
                    onClick={() => setSelectedProv(v)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                      selectedProv?.name === v.name ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${color}`}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 w-16 flex-shrink-0">
                      {v.name.replace(/省|市|自治区|壮族|回族|维吾尔|自治州|地区/g, '')}
                    </span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-10 text-right flex-shrink-0">{v.count}次</span>
                  </button>
                );
              });
            })()}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">暂无足迹数据</p>
        )}
      </div>

      {/* 年度热力图 */}
      <YearHeatmap
        tickets={allTickets}
        year={heatYear}
        onYearChange={setHeatYear}
        availableYears={heatmapYears}
      />

    </div>
  );
}
