import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();

  // HashRouter 的 # 和 Supabase 追加的 # 会重叠，需从 hash 中正则提取 token
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/access_token=([^&]+)/);
    const refreshMatch = hash.match(/refresh_token=([^&]+)/);
    const accessToken = match?.[1];
    const refreshToken = refreshMatch?.[1];

    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data }) => {
          if (data.session) {
            // 清理 URL 中的 token，避免泄露
            window.history.replaceState(null, '', window.location.pathname + '#/reset-password');
            setSessionReady(true);
          } else {
            setMsg('会话建立失败，请重新发起找回密码');
          }
        })
        .catch(() => setMsg('会话建立失败，请重新发起找回密码'));
    } else {
      // 检查是否 Supabase 已自动建立了 session
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setSessionReady(true);
        } else {
          setMsg('无效的重置链接，请从邮件中重新打开');
        }
      });
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMsg(error.message);
    } else {
      setDone(true);
      setMsg('密码修改成功');
    }
    setLoading(false);
  };

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm bg-white/75 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 p-6 text-center">
          {msg ? (
            <>
              <p className="text-red-500 text-sm mb-4">{msg}</p>
              <button onClick={() => navigate('/login')} className="text-blue-600 text-sm hover:underline">返回登录</button>
            </>
          ) : (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-8">TickBook</h1>
        {done ? (
          <div className="bg-white/75 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 p-6 text-center">
            <p className="text-green-600 text-sm mb-4">{msg}</p>
            <button onClick={() => navigate('/login')} className="text-blue-600 text-sm hover:underline">去登录</button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="bg-white/75 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-800 text-center">设置新密码</h2>
            {msg && <div className="bg-red-50 text-red-600 text-sm rounded px-3 py-2">{msg}</div>}
            <div>
              <label className="block text-sm text-gray-600 mb-1">新密码</label>
              <input type="password" required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="至少 6 位"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? '提交中...' : '确认修改'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
