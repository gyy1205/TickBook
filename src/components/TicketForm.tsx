import { useEffect, useState } from 'react';
import type { Ticket } from '../types';
import { TEMPLATES } from '../config/templates';
import { fetchTickets } from '../services/ticketService';
import StationInput from './StationInput';
import TicketTemplate from './TicketTemplate';

interface Props {
  initial: Ticket;
  onSave: (ticket: Ticket) => Promise<void>;
  saving: boolean;
}

export default function TicketForm({ initial, onSave, saving }: Props) {
  const [ticket, setTicket] = useState<Ticket>(initial);
  const [history, setHistory] = useState<Ticket[]>([]);

  useEffect(() => {
    fetchTickets().then(setHistory).catch(() => {});
  }, []);

  // 从历史记录中提取唯一值
  const uniqueValues = (field: keyof Ticket) =>
    [...new Set(history.map((t) => String(t[field] || '')).filter(Boolean))];

  const update = (field: keyof Ticket, value: string | number | boolean) => {
    setTicket((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(ticket);
  };

  const inputClass =
    'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent';
  const labelClass = 'block text-sm text-gray-600 mb-1';

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* 左侧：表单 */}
      <form onSubmit={handleSubmit} className="flex-1 space-y-4">
        {/* 票种选择 */}
        <div>
          <label className={labelClass}>票种</label>
          <div className="flex gap-4 flex-wrap">
            {([
              ['train', '火车票'],
              ['reimbursement', '报销凭证（乘车）'],
              ['reimbursement_no_travel', '报销凭证（未乘车）'],
            ] as const).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ticket_type"
                  checked={ticket.ticket_type === value}
                  onChange={() => update('ticket_type', value)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
          {ticket.ticket_type === 'reimbursement_no_travel' && (
            <p className="text-xs text-amber-600 mt-1">未乘车不计入站点统计和乘车时长</p>
          )}
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={ticket.is_online}
                onChange={(e) => update('is_online', e.target.checked)} className="accent-blue-600" />
              <span className="text-sm text-gray-600">网络票</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={ticket.is_discount}
                onChange={(e) => update('is_discount', e.target.checked)} className="accent-blue-600" />
              <span className="text-sm text-gray-600">优惠票</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={ticket.is_student}
                onChange={(e) => update('is_student', e.target.checked)} className="accent-blue-600" />
              <span className="text-sm text-gray-600">学生票</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={ticket.is_exchange}
                onChange={(e) => update('is_exchange', e.target.checked)} className="accent-blue-600" />
              <span className="text-sm text-gray-600">兑换票</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={ticket.is_replacement}
                onChange={(e) => update('is_replacement', e.target.checked)} className="accent-blue-600" />
              <span className="text-sm text-gray-600">补票</span>
            </label>
          </div>
        </div>

        {/* 模板选择 */}
        <div>
          <label className={labelClass}>票根模板</label>
          <select
            value={ticket.template || 'none'}
            onChange={(e) => update('template', e.target.value)}
            className={inputClass}
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* 车次 */}
        <div>
          <label className={labelClass}>车次</label>
          <input
            type="text"
            value={ticket.train_number}
            onChange={(e) => update('train_number', e.target.value)}
            placeholder="如 G1234"
            className={inputClass}
          />
        </div>

        {/* 出发站 / 到达站 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>出发站</label>
            <StationInput
              value={ticket.departure_station}
              onChange={(v) => update('departure_station', v)}
              placeholder="如 北京南"
            />
          </div>
          <div>
            <label className={labelClass}>到达站</label>
            <StationInput
              value={ticket.arrival_station}
              onChange={(v) => update('arrival_station', v)}
              placeholder="如 上海虹桥"
            />
          </div>
        </div>

        {/* 出发日期 / 时间 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>出发日期</label>
            <input
              type="date"
              value={ticket.departure_date}
              onChange={(e) => update('departure_date', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>出发时间</label>
            <input
              type="time"
              value={ticket.departure_time}
              onChange={(e) => update('departure_time', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* 到达时间 */}
        {ticket.ticket_type !== 'reimbursement_no_travel' && (
        <div>
          <label className={labelClass}>到达时间</label>
          <input
            type="time"
            value={ticket.arrival_time}
            onChange={(e) => update('arrival_time', e.target.value)}
            className={inputClass}
          />
        </div>
        )}

        {/* 座位信息 */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>座位等级</label>
            <input
              type="text"
              value={ticket.seat_class}
              onChange={(e) => update('seat_class', e.target.value)}
              list="history_seat_class"
              placeholder="如 二等座"
              className={inputClass}
            />
            <datalist id="history_seat_class">
              {uniqueValues('seat_class').map((v) => <option key={v} value={v} />)}
            </datalist>
          </div>
          <div>
            <label className={labelClass}>车厢号</label>
            <input
              type="text"
              value={ticket.carriage_no}
              onChange={(e) => update('carriage_no', e.target.value)}
              placeholder="如 05"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>座位号</label>
            <input
              type="text"
              value={ticket.seat_no}
              onChange={(e) => update('seat_no', e.target.value)}
              placeholder="如 12A"
              className={inputClass}
            />
          </div>
        </div>

        {/* 乘客 + 票价 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>乘客姓名</label>
            <input
              type="text"
              value={ticket.passenger_name}
              onChange={(e) => update('passenger_name', e.target.value)}
              placeholder="姓名"
              list="history_passenger_name"
              className={inputClass}
            />
            <datalist id="history_passenger_name">
              {uniqueValues('passenger_name').map((v) => <option key={v} value={v} />)}
            </datalist>
          </div>
          <div>
            <label className={labelClass}>票价 (¥)</label>
            <input
              type="number"
              step="0.01"
              value={ticket.price || ''}
              onChange={(e) => update('price', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
        </div>

        {/* 身份证号 */}
        <div>
          <label className={labelClass}>乘车人身份证号</label>
          <input
            type="text"
            value={ticket.passenger_id}
            onChange={(e) => update('passenger_id', e.target.value)}
            placeholder="如 3206212026****0000（脱敏存储）"
            list="history_passenger_id"
            className={inputClass}
          />
          <datalist id="history_passenger_id">
            {uniqueValues('passenger_id').map((v) => <option key={v} value={v} />)}
          </datalist>
        </div>

        {/* 票号 */}
        <div>
          <label className={labelClass}>票号 / 流水号</label>
          <input
            type="text"
            value={ticket.serial_number}
            onChange={(e) => update('serial_number', e.target.value)}
            placeholder="票号"
            className={inputClass}
          />
        </div>

        {/* 检票口 */}
        <div>
          <label className={labelClass}>检票口</label>
          <input
            type="text"
            value={ticket.gate_info}
            onChange={(e) => update('gate_info', e.target.value)}
            placeholder="如 一楼检票口"
            className={inputClass}
          />
        </div>

        {/* 备注 */}
        <div>
          <label className={labelClass}>备注</label>
          <textarea
            value={ticket.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={2}
            placeholder="备注信息（可选），第一行=备注1，第二行=备注2"
            className={inputClass}
          />
        </div>

        {/* 二维码内容 */}
        <div>
          <label className={labelClass}>二维码内容</label>
          <input
            type="text"
            value={ticket.qr_content}
            onChange={(e) => update('qr_content', e.target.value)}
            placeholder="扫描二维码显示的内容，如：票号或网址"
            className={inputClass}
          />
        </div>

        {/* 底部服务提示 */}
        <div>
          <label className={labelClass}>底部提示文字（虚线框内）</label>
          <textarea
            value={ticket.service_text}
            onChange={(e) => update('service_text', e.target.value)}
            rows={2}
            placeholder="如：买票请到12306"
            className={inputClass}
          />
        </div>

        {/* 保存按钮 */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </form>

      {/* 右侧：实时预览 */}
      <div className="lg:w-80 lg:sticky lg:top-6 self-start">
        <p className="text-sm text-gray-400 text-center mb-3">实时预览</p>
        <TicketTemplate ticket={ticket} />
      </div>
    </div>
  );
}
