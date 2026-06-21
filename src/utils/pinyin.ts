import { pinyin } from 'pinyin-pro';

// 中文站名 → 英文拼音（不含声调，首字母大写）
// 如 "海安" → "Haian", "北京南" → "Beijingnan"
export function toStationPinyin(chinese: string): string {
  if (!chinese) return '';
  // 去掉末尾的"站"字
  const name = chinese.replace(/站$/, '');
  if (!name) return '';

  const py = pinyin(name, { toneType: 'none', type: 'array' });
  // 全部小写拼接，仅首字母大写
  const joined = py.join('');
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

// 带分隔的拼音（用于不熟悉中文的乘客判读）
// 如 "海安" → "Hai An", "北京南" → "Bei Jing Nan"
export function toStationPinyinSpaced(chinese: string): string {
  if (!chinese) return '';
  const name = chinese.replace(/站$/, '');
  if (!name) return '';

  const py = pinyin(name, { toneType: 'none', type: 'array' });
  return py.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}
