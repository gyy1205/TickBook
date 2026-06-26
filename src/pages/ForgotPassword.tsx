import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/#/reset-password',
    });
    if (error) {
      setMsg(error.message);
    } else {
      setSent(true);
      setMsg('重置密码邮件已发送，请检查邮箱');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-8">TickBook</h1>

        {sent ? (
          <div className="bg-white/75 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 p-6 text-center">
            <p className="text-green-600 text-sm mb-4">{msg}</p>
            <Link to="/login" className="text-blue-600 text-sm hover:underline">
              返回登录
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSend} className="bg-white/75 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-800 text-center">找回密码</h2>
            {msg && <div className="bg-red-50 text-red-600 text-sm rounded px-3 py-2">{msg}</div>}
            <div>
              <label className="block text-sm text-gray-600 mb-1">注册邮箱</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '发送中...' : '发送重置邮件'}
            </button>
            <p className="text-center text-sm text-gray-400">
              <Link to="/login" className="text-blue-600 hover:underline">返回登录</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
