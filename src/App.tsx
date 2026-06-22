import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TicketCreate from './pages/TicketCreate';
import TicketEdit from './pages/TicketEdit';
import TicketDetail from './pages/TicketDetail';
import Statistics from './pages/Statistics';
import MapPage from './pages/MapPage';

export default function App() {
  const { setSession, refreshSession } = useAuthStore();

  // 监听 Supabase 登录状态变化
  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // 初始加载时恢复 session
    refreshSession();
  }, [setSession, refreshSession]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/tickets/new" element={<TicketCreate />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/tickets/:id/edit" element={<TicketEdit />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/map" element={<MapPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
