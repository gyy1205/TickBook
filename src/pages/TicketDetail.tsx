import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Ticket } from '../types';
import { fetchTicket, deleteTicket } from '../services/ticketService';
import TicketTemplate from '../components/TicketTemplate';

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchTicket(id)
      .then(setTicket)
      .catch((err) => {
        console.error('加载票据失败:', err);
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id || !confirm('确定删除这张票据吗？')) return;
    await deleteTicket(id);
    navigate('/', { replace: true });
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-20">加载中...</div>;
  }

  if (!ticket) {
    return <div className="text-center text-gray-400 py-20">票据不存在</div>;
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 no-underline">
          ← 返回列表
        </Link>
        <div className="ml-auto flex gap-2">
          <Link
            to={`/tickets/${ticket.id}/edit`}
            className="text-sm text-blue-600 hover:text-blue-800 no-underline"
          >
            编辑
          </Link>
          <button
            onClick={handleDelete}
            className="text-sm text-red-400 hover:text-red-600"
          >
            删除
          </button>
        </div>
      </div>

      <TicketTemplate ticket={ticket} />
    </div>
  );
}
