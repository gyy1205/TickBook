import { Outlet, NavLink } from 'react-router-dom';
import Header from './Header';

const navItems = [
  { to: '/', label: '我的票据', icon: '🎫' },
  { to: '/statistics', label: '数据统计', icon: '📊' },
  { to: '/map', label: '足迹地图', icon: '🗺️' },
  { to: '/report', label: '年度报告', icon: '🏆' },
  { to: '/book', label: '票据展示', icon: '📖' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* 侧边导航 */}
        <aside className="w-40 flex-shrink-0 hidden sm:block">
          <nav className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sticky top-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded text-sm no-underline transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <span className="mr-1.5">{item.icon}</span>{item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* 主体内容 */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
