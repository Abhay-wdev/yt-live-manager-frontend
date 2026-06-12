import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Video, ListVideo, Calendar, Settings, LogOut, Radio, Tv, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Layout = () => {
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Streams Manager', icon: Radio, path: '/streams' },
    { name: 'Videos', icon: Video, path: '/videos' },
    { name: 'Playlists', icon: ListVideo, path: '/playlists' },
    { name: 'Channels', icon: Tv, path: '/channels' },
    { name: 'Scheduling', icon: Calendar, path: '/schedules' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-[#0f1115] text-gray-200 overflow-hidden font-sans">
      
      {/* Mobile Top Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 z-50 flex items-center justify-between px-4">
        <div className="flex items-center">
          <Radio className="w-6 h-6 text-red-500 mr-2" />
          <h1 className="text-lg font-bold text-white tracking-tight">YT Live Manager</h1>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-400 hover:text-white">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden lg:flex items-center p-6 border-b border-gray-800">
          <Radio className="w-8 h-8 text-red-500 mr-3" />
          <h1 className="text-xl font-bold text-white tracking-tight">YT Live Manager</h1>
        </div>
        
        {/* Spacer for mobile header */}
        <div className="h-16 lg:hidden"></div>

        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-6 py-3 transition-colors text-sm font-medium ${
                    isActive 
                      ? 'bg-red-500/10 text-red-500 border-r-4 border-red-500' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon className={`w-5 h-5 mr-3 ${location.pathname === item.path ? 'text-red-500' : 'text-gray-500'}`} />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-400 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0 bg-[#0f1115]">
        <div className="mx-auto max-w-7xl">
           <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
