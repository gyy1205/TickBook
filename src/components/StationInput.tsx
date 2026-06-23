import { useState, useMemo, useRef, useEffect } from 'react';
import stationData from '../../stations_data.json';

// 提取所有唯一站名（含"站"和不含"站"两种形式）
const allStations = stationData.raw.map((s: any) => s.station_name.trim());
const uniqueStations = [...new Set(allStations)].sort();

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function StationInput({ value, onChange, placeholder }: Props) {
  const [focused, setFocused] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!value) return uniqueStations.slice(0, 12);
    const v = value.toLowerCase();
    return uniqueStations.filter((s) => s.toLowerCase().includes(v)).slice(0, 12);
  }, [value]);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const select = (name: string) => {
    onChange(name);
    setFocused(false);
    setSelectedIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!focused || filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault();
      select(filtered[selectedIdx]);
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setSelectedIdx(-1); }}
        onFocus={() => setFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
      />
      {focused && filtered.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
          {filtered.map((name, i) => (
            <li
              key={name}
              onMouseDown={() => select(name)}
              className={`px-3 py-1.5 text-sm cursor-pointer ${
                i === selectedIdx ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
