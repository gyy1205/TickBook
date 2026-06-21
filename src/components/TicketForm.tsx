import { useState } from 'react';
import type { Ticket } from '../types';
import TicketTemplate from './TicketTemplate';

interface Props {
  initial: Ticket;
  onSave: (ticket: Ticket) => Promise<void>;
  saving: boolean;
}

export default function TicketForm({ initial, onSave, saving }: Props) {
  const [ticket, setTicket] = useState<Ticket>(initial);

  const update = (field: keyof Ticket, value: string | number) => {
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
          <div className="flex gap-4">
            {(['train', 'reimbursement'] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ticket_type"
                  checked={ticket.ticket_type === type}
                  onChange={() => update('ticket_type', type)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700">
                  {type === 'train' ? '火车票' : '报销凭证'}
                </span>
              </label>
            ))}
          </div>
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
            <input
              type="text"
              value={ticket.departure_station}
              onChange={(e) => update('departure_station', e.target.value)}
              placeholder="如 北京南"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>到达站</label>
            <input
              type="text"
              value={ticket.arrival_station}
              onChange={(e) => update('arrival_station', e.target.value)}
              placeholder="如 上海虹桥"
              className={inputClass}
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
        <div>
          <label className={labelClass}>到达时间</label>
          <input
            type="time"
            value={ticket.arrival_time}
            onChange={(e) => update('arrival_time', e.target.value)}
            className={inputClass}
          />
        </div>

        {/* 座位信息 */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>座位等级</label>
            <select
              value={ticket.seat_class}
              onChange={(e) => update('seat_class', e.target.value)}
              className={inputClass}
            >
              <option>商务座</option>
              <option>一等座</option>
              <option>二等座</option>
              <option>软卧</option>
              <option>硬卧</option>
              <option>硬座</option>
              <option>无座</option>
            </select>
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
              className={inputClass}
            />
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

        {/* 备注 */}
        <div>
          <label className={labelClass}>备注</label>
          <textarea
            value={ticket.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={2}
            placeholder="备注信息（可选）"
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
