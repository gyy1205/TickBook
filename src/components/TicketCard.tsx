import { Link } from 'react-router-dom';
import type { Ticket } from '../types';

interface Props {
  ticket: Ticket;
  onDelete: (id: string) => void;
}

export default function TicketCard({ ticket, onDelete }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-lg font-bold text-gray-800">{ticket.train_number}</span>
          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
            {ticket.seat_class}
          </span>
        </div>
        <span className="text-lg font-bold text-orange-500">¥{ticket.price}</span>
      </div>

      <div className="text-sm text-gray-600 space-y-1 mb-3">
        <div className="flex justify-between">
          <span>{ticket.departure_station}</span>
          <span className="text-gray-400">→</span>
          <span>{ticket.arrival_station}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>{ticket.departure_date} {ticket.departure_time}</span>
          <span>{ticket.arrival_time}</span>
        </div>
        <div>
          {ticket.passenger_name} | {ticket.carriage_no}车{ticket.seat_no}号
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <Link
          to={`/tickets/${ticket.id}`}
          className="text-sm text-blue-600 hover:text-blue-800 no-underline"
        >
          查看
        </Link>
        <Link
          to={`/tickets/${ticket.id}/edit`}
          className="text-sm text-gray-500 hover:text-gray-700 no-underline"
        >
          编辑
        </Link>
        <button
          onClick={() => {
            if (confirm('确定删除这张票据吗？')) {
              onDelete(ticket.id!);
            }
          }}
          className="text-sm text-red-400 hover:text-red-600 ml-auto"
        >
          删除
        </button>
      </div>
    </div>
  );
}
