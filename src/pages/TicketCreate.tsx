import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Ticket } from '../types';
import { emptyTicket } from '../types';
import { createTicket } from '../services/ticketService';
import { playSave } from '../utils/sound';
import TicketForm from '../components/TicketForm';

export default function TicketCreate() {
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSave = async (ticket: Ticket) => {
    setSaving(true);
    try {
      await createTicket(ticket);
      playSave();
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('保存失败:', err);
      alert('保存失败：' + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">新建票据</h1>
      <TicketForm initial={emptyTicket} onSave={handleSave} saving={saving} />
    </div>
  );
}
