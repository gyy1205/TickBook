import type { Ticket } from '../types';

interface Props {
  ticket: Partial<Ticket>;
}

export default function TicketTemplate({ ticket }: Props) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg w-full max-w-sm mx-auto select-none">
      {/* 票面主体 - 蓝色边框 */}
      <div className="border-2 border-blue-700 rounded-lg overflow-hidden">

        {/* 顶部：车次 + 票种 */}
        <div className="bg-blue-700 text-white px-4 py-2 flex justify-between items-center">
          <span className="text-xs tracking-wider">中国铁路 CHINA RAILWAY</span>
          <span className="text-xs bg-white text-blue-700 px-2 py-0.5 rounded font-bold">
            {ticket.ticket_type === 'reimbursement' ? '报销凭证' : '车票'}
          </span>
        </div>

        {/* 车次 */}
        <div className="text-center py-3 border-b border-dashed border-gray-300">
          <span className="text-3xl font-bold text-blue-700 tracking-wider">
            {ticket.train_number || '----'}
          </span>
        </div>

        {/* 出发 - 到达 */}
        <div className="flex items-center px-5 py-4 border-b border-dashed border-gray-300">
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {ticket.departure_station || '---'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {ticket.departure_date || '----'} {ticket.departure_time || '--:--'}
            </div>
          </div>

          <div className="flex flex-col items-center px-3">
            <span className="text-gray-300 text-lg">→</span>
          </div>

          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {ticket.arrival_station || '---'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {ticket.arrival_time || '--:--'}
            </div>
          </div>
        </div>

        {/* 详细信息 */}
        <div className="px-5 py-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">乘客</span>
            <span className="font-medium text-gray-800">
              {ticket.passenger_name || '---'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">座位</span>
            <span className="font-medium text-gray-800">
              {ticket.seat_class || '---'}
              {ticket.carriage_no ? ` / ${ticket.carriage_no}车` : ''}
              {ticket.seat_no ? ` ${ticket.seat_no}号` : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">票价</span>
            <span className="font-bold text-orange-500 text-lg">
              {ticket.price ? `¥${ticket.price}` : '---'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">票号</span>
            <span className="text-xs text-gray-500 font-mono">
              {ticket.serial_number || '---'}
            </span>
          </div>
          {ticket.notes && (
            <div className="flex justify-between">
              <span className="text-gray-400">备注</span>
              <span className="text-gray-600 text-xs">{ticket.notes}</span>
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="bg-gray-50 px-4 py-2 text-center">
          <span className="text-xs text-gray-400">
            {ticket.ticket_type === 'reimbursement' ? '仅供报销使用' : '请妥善保管'}
          </span>
        </div>
      </div>
    </div>
  );
}
