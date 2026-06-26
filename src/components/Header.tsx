import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

export default function Header() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleChangePwd = async () => {
    setPwdMsg('');
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) { setPwdMsg(error.message); }
    else { setPwdMsg('修改成功'); setTimeout(() => { setShowPwd(false); setNewPwd(''); setPwdMsg(''); }, 1500); }
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600 no-underline">TickBook</Link>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-sm text-gray-500">{user.email}</span>
              <button onClick={() => setShowPwd(!showPwd)} className="text-sm text-gray-400 hover:text-gray-600">修改密码</button>
              <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-red-500 transition-colors">退出</button>
            </>
          )}
        </div>
      </div>
      {showPwd && user && (
        <div className="max-w-6xl mx-auto px-4 pb-3 flex items-center gap-2">
          <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="新密码（至少6位）"
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <button onClick={handleChangePwd} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">确认</button>
          {pwdMsg && <span className="text-xs text-green-600">{pwdMsg}</span>}
        </div>
      )}
    </header>
  );
}
