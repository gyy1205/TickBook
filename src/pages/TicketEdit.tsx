import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Ticket } from '../types';
import { fetchTicket, updateTicket } from '../services/ticketService';
import TicketForm from '../components/TicketForm';

export default function TicketEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [saving, setSaving] = useState(false);
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

  const handleSave = async (updated: Ticket) => {
    if (!id) return;
    setSaving(true);
    try {
      await updateTicket(id, updated);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-20">加载中...</div>;
  }

  if (!ticket) {
    return <div className="text-center text-gray-400 py-20">票据不存在</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">编辑票据</h1>
      <TicketForm initial={ticket} onSave={handleSave} saving={saving} />
    </div>
  );
}
