import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshSession } = useAuthStore();

  // 已登录则跳转首页
  const user = useAuthStore((s) => s.user);
  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = isRegister
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    if (isRegister) {
      setError('注册成功！请查看邮箱确认（如未开启邮箱确认则可直接登录）。');
      setIsRegister(false);
      setLoading(false);
      return;
    }

    await refreshSession();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-8">
          TickBook
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white/75 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 p-6 space-y-4"
        >
          <h2 className="text-lg font-medium text-gray-800 text-center">
            {isRegister ? '注册' : '登录'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-1">邮箱</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">密码</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '处理中...' : isRegister ? '注册' : '登录'}
          </button>

          <p className="text-center text-sm text-gray-400">
            {isRegister ? '已有账号？' : '没有账号？'}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-blue-600 hover:underline ml-1"
            >
              {isRegister ? '去登录' : '去注册'}
            </button>
          </p>
          {!isRegister && (
            <p className="text-center">
              <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-blue-600">忘记密码？</Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
