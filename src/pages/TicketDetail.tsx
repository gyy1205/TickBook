import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { domToPng } from 'modern-screenshot';
import type { Ticket } from '../types';
import { fetchTicket, deleteTicket } from '../services/ticketService';
import TicketTemplate from '../components/TicketTemplate';

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingImg, setSavingImg] = useState(false);
  const [sharing, setSharing] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);

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

  const handleShareCard = async () => {
    if (!shareRef.current) return;
    setSharing(true);
    try {
      const dataUrl = await domToPng(shareRef.current, { backgroundColor: '#f8fafc', scale: 2 });
      const link = document.createElement('a');
      link.download = `ticket_${ticket?.train_number || 'card'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('生成分享卡片失败:', err);
    } finally {
      setSharing(false);
    }
  };

  const handleSaveImage = async () => {
    if (!ticketRef.current) return;
    setSavingImg(true);
    try {
      const dataUrl = await domToPng(ticketRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `ticket_${ticket?.train_number || 'unknown'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('保存图片失败:', err);
      alert('保存失败');
    } finally {
      setSavingImg(false);
    }
  };

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
            onClick={handleSaveImage}
            disabled={savingImg}
            className="text-sm text-green-600 hover:text-green-800"
          >
            {savingImg ? '保存中...' : '保存图片'}
          </button>
          <button
            onClick={handleShareCard}
            disabled={sharing}
            className="text-sm text-purple-600 hover:text-purple-800"
          >
            {sharing ? '生成中...' : '分享卡片'}
          </button>
          <button
            onClick={handleDelete}
            className="text-sm text-red-400 hover:text-red-600"
          >
            删除
          </button>
        </div>
      </div>

      <div ref={ticketRef}>
        <TicketTemplate ticket={ticket} />
      </div>

      {/* 分享卡片（隐藏，截图用） */}
      <div ref={shareRef} className="fixed left-[-9999px] top-0" style={{ width: 400 }}>
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-lg">
          {/* 卡片标题 */}
          <div className="text-center mb-4">
            <p className="text-xs text-gray-400 tracking-widest uppercase">Travel Memory</p>
            <p className="text-lg font-bold text-gray-800">{ticket.train_number}</p>
          </div>
          {/* 路线 */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{ticket.departure_station}</p>
              <p className="text-xs text-gray-400">{ticket.departure_time}</p>
            </div>
            <span className="text-gray-300 text-2xl">→</span>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{ticket.arrival_station}</p>
              <p className="text-xs text-gray-400">{ticket.arrival_time}</p>
            </div>
          </div>
          {/* 日期 */}
          <p className="text-center text-sm text-gray-500 mb-4">{ticket.departure_date}</p>
          {/* 详细信息 */}
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div className="bg-blue-50 rounded-lg py-2">
              <p className="text-xs text-gray-400">座位</p>
              <p className="text-sm font-medium text-gray-700">{ticket.seat_class}</p>
            </div>
            <div className="bg-blue-50 rounded-lg py-2">
              <p className="text-xs text-gray-400">票价</p>
              <p className="text-sm font-bold text-orange-500">¥{ticket.price}</p>
            </div>
            <div className="bg-blue-50 rounded-lg py-2">
              <p className="text-xs text-gray-400">乘客</p>
              <p className="text-sm font-medium text-gray-700">{ticket.passenger_name}</p>
            </div>
          </div>
          {/* 底部 */}
          <div className="text-center pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-400">— TickBook · 记录每一段旅程 —</p>
          </div>
        </div>
      </div>
    </div>
  );
}
