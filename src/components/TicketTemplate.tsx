import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Ticket } from '../types';
import { getTemplate } from '../config/templates';
import { toStationPinyin } from '../utils/pinyin';

interface Props {
  ticket: Partial<Ticket>;
}

export default function TicketTemplate({ ticket }: Props) {
  const tpl = getTemplate(ticket.template || 'none');
  const hasImage = tpl.image !== '';

  if (!hasImage) {
    return (
      <div className="bg-white rounded-lg overflow-hidden shadow-lg w-full max-w-sm mx-auto select-none">
        <DefaultLayout ticket={ticket} />
      </div>
    );
  }

  const f = tpl.fields;

  const unitStyle = { fontSize: '0.7em' };

  const fmtDeparture = () => {
    const d = ticket.departure_date || '';
    const t = ticket.departure_time || '';
    if (!d) return t;
    const [y, m, day] = d.split('-');
    const unitGap = { marginLeft: '0.25em', marginRight: '0.25em' };
    return (
      <>
        {y}<span style={{...unitStyle, ...unitGap}}>年</span>
        {parseInt(m || '1')}<span style={{...unitStyle, ...unitGap}}>月</span>
        {parseInt(day || '1')}<span style={{...unitStyle, ...unitGap}}>日</span>
        {t}<span style={{...unitStyle, ...unitGap}}>开</span>
      </>
    );
  };

  const unitGap = { marginLeft: '0.25em', marginRight: '0.25em' };

  const fmtCarriage = () => (
    <>
      {ticket.carriage_no ? <>{ticket.carriage_no}<span style={{...unitStyle, ...unitGap}}>车</span></> : ''}
      {ticket.seat_no ? <>{ticket.seat_no}<span style={{...unitStyle, ...unitGap}}>号</span></> : ''}
    </>
  );

  // 站名：两字中间空一字距，三字及以上正常
  const fmtStation = (name: string): string => {
    if (!name) return '';
    if (name.length === 2) return name.split('').join('　');
    return name;
  };

  const notesText = ticket.notes || '';
  const notesLines = notesText.split('\n');

  const Field = ({
    field, value,
  }: {
    field: { x: number; y: number; size: number; color: string; align: string; underline?: boolean; bold?: boolean; fontFamily?: string };
    value: React.ReactNode;
  }) => {
    if (!value) return null;
    const transformMap: Record<string, string> = {
      left:   'translate(0, -50%)',
      right:  'translate(-100%, -50%)',
      center: 'translate(-50%, -50%)',
    };
    return (
      <span
        style={{
          position: 'absolute',
          left: `${field.x}%`,
          top: `${field.y}%`,
          transform: transformMap[field.align] || transformMap.center,
          fontSize: `${field.size}cqw`,
          color: field.color,
          fontWeight: field.bold ? 700 : field.underline ? 600 : 500,
          whiteSpace: 'nowrap',
          textAlign: field.align as any,
          fontFamily: field.fontFamily || "'SimHei','Microsoft YaHei','PingFang SC',sans-serif",
          textDecoration: field.underline ? 'underline' : 'none',
          textUnderlineOffset: '0.25em',
        }}
      >
        {value}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg w-full max-w-sm mx-auto select-none">
      <div
        className="relative w-full overflow-hidden rounded-lg"
        style={{ containerType: 'inline-size', aspectRatio: tpl.aspectRatio }}
      >
        <img src={tpl.image} alt={tpl.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0">
          {/* 1. 票号 */}
          <Field field={f.serial_number} value={ticket.serial_number || ''} />
          {/* 2. 检票口 */}
          <Field field={f.gate_info} value={ticket.gate_info || ''} />
          {/* 3. 出发站名 + 站字 */}
          <StationField field={f.departure_station} name={fmtStation(ticket.departure_station || '')} />
          {/* 4. 出发站英文 */}
          <Field field={f.departure_station_en} value={ticket.departure_station_en || toStationPinyin(ticket.departure_station || '')} />
          {/* 5. 车次 */}
          <Field field={f.train_number} value={ticket.train_number || ''} />
          {/* 车次下方长箭头 ———► */}
          <LongArrow show={!!ticket.train_number} />
          {/* 6. 到达站名 + 站字 */}
          <StationField field={f.arrival_station} name={fmtStation(ticket.arrival_station || '')} alignRight />
          {/* 7. 到达站英文 */}
          <Field field={f.arrival_station_en} value={ticket.arrival_station_en || toStationPinyin(ticket.arrival_station || '')} />
          {/* 8. 发车时间 */}
          <Field field={f.departure_info} value={fmtDeparture()} />
          {/* 9. 票价 */}
          <Field field={f.price} value={ticket.price ?
            <>{'¥ '}{Number(ticket.price).toFixed(1)}元</>
          : ''} />
          {/* 10. 学生票标识 */}
          <Field field={f.student_mark} value={ticket.is_student ? '学' : ''} />
          {/* 11. 车厢座位号 */}
          <Field field={f.carriage_info} value={fmtCarriage()} />
          {/* 12. 座位等级 */}
          <Field field={f.seat_class} value={ticket.seat_class || ''} />
          {/* 13. 备注1 */}
          <Field field={f.notes_line1} value={notesLines[0] || ''} />
          {/* 14. 备注2 */}
          <Field field={f.notes_line2} value={notesLines[1] || ''} />
          {/* 15-16. 乘车人（身份证号 + 姓名） */}
          <Field
            field={f.passenger_full}
            value={[ticket.passenger_id, ticket.passenger_name].filter(Boolean).join(' ')}
          />
          {/* 17. 底部服务提示虚线框 */}
          <ServiceTextBox text={ticket.service_text || ''} />
          {/* 18. 二维码 */}
          <QRImage content={ticket.qr_content || ''} />
        </div>
      </div>
    </div>
  );
}

// 站名 + 固定"站"字后缀
function StationField({
  field, name, alignRight,
}: {
  field: { x: number; y: number; size: number; color: string; align: string };
  name: string;
  alignRight?: boolean;
}) {
  const align = alignRight ? 'right' : 'left';
  const transformMap: Record<string, string> = {
    left: 'translate(0, -50%)',
    right: 'translate(-100%, -50%)',
  };

  return (
    <span
      style={{
        position: 'absolute',
        left: `${field.x}%`,
        top: `${field.y}%`,
        transform: transformMap[align],
        fontSize: `${field.size}cqw`,
        color: field.color,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        fontFamily: "'SimHei','Microsoft YaHei','PingFang SC',sans-serif",
      }}
    >
      <span>{name}</span>
      <span style={{ fontSize: `${field.size * 0.7}cqw`, fontWeight: 400 }}>
        站
      </span>
    </span>
  );
}

// 车次下方箭头 ———►
function LongArrow({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: '42.5%',
        right: '42.5%',
        top: '27%',
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* 横线 */}
      <div style={{ flex: 1, borderTop: '2px solid #1a1a1a', height: 0 }} />
      {/* 向右箭头 */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: '2cqw solid #1a1a1a',
          borderTop: '0.7cqw solid transparent',
          borderBottom: '0.7cqw solid transparent',
        }}
      />
    </div>
  );
}

// 二维码
function QRImage({ content }: { content: string }) {
  const [dataUrl, setDataUrl] = useState('');
  useEffect(() => {
    if (!content) { setDataUrl(''); return; }
    QRCode.toDataURL(content, { width: 300, margin: 1, color: { dark: '#000', light: '#ffffff00' } })
      .then(setDataUrl)
      .catch(() => setDataUrl(''));
  }, [content]);

  if (!dataUrl) return null;
  return (
    <img
      src={dataUrl}
      alt="QR"
      style={{
        position: 'absolute',
        right: '8%',
        bottom: '10%',
        width: '18%',
        height: 'auto',
        aspectRatio: '1 / 1',
      }}
    />
  );
}

// 底部虚线框服务提示
function ServiceTextBox({ text }: { text: string }) {
  const lines = (text || '买票请到12306\n发货请到95306').split('\n');
  return (
    <div
      style={{
        position: 'absolute',
        left: '10%',
        right: '40%',  // → 右边界到 60%
        top: '77%',
        bottom: '10%',
        border: '1.5px dashed #888',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1% 3%',
        fontSize: `${3}cqw`,
        color: '#333',
        fontFamily: "'SimHei','Microsoft YaHei','PingFang SC',sans-serif",
        lineHeight: 1.15,
        textAlign: 'center' as const,
      }}
    >
      {lines.map((line, i) => (
        <span key={i}>{line}</span>
      ))}
    </div>
  );
}

function DefaultLayout({ ticket }: { ticket: Partial<Ticket> }) {
  return (
    <div className="border-2 border-blue-700 rounded-lg overflow-hidden">
      <div className="bg-blue-700 text-white px-4 py-2 flex justify-between items-center">
        <span className="text-xs tracking-wider">中国铁路 CHINA RAILWAY</span>
        <span className="text-xs bg-white text-blue-700 px-2 py-0.5 rounded font-bold">车票</span>
      </div>
      <div className="text-center py-3 border-b border-dashed border-gray-300">
        <span className="text-3xl font-bold text-blue-700 tracking-wider">{ticket.train_number || '----'}</span>
      </div>
      <div className="flex items-center px-5 py-4 border-b border-dashed border-gray-300">
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold text-gray-900">{ticket.departure_station || '---'}</div>
          <div className="text-xs text-gray-400 mt-1">{ticket.departure_date || '----'} {ticket.departure_time || '--:--'}</div>
        </div>
        <div className="flex flex-col items-center px-3">
          <span className="text-gray-300 text-lg">→</span>
        </div>
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold text-gray-900">{ticket.arrival_station || '---'}</div>
          <div className="text-xs text-gray-400 mt-1">{ticket.arrival_time || '--:--'}</div>
        </div>
      </div>
      <div className="px-5 py-3 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-400">乘客</span><span className="font-medium text-gray-800">{ticket.passenger_name || '---'}</span></div>
        <div className="flex justify-between"><span className="text-gray-400">座位</span><span className="font-medium text-gray-800">{[ticket.seat_class, ticket.carriage_no ? `${ticket.carriage_no}车` : '', ticket.seat_no ? `${ticket.seat_no}号` : ''].filter(Boolean).join(' / ') || '---'}</span></div>
        <div className="flex justify-between"><span className="text-gray-400">票价</span><span className="font-bold text-orange-500 text-lg">{ticket.price ? `¥${ticket.price}` : '---'}</span></div>
      </div>
      <div className="bg-gray-50 px-4 py-2 text-center"><span className="text-xs text-gray-400">请妥善保管</span></div>
    </div>
  );
}
