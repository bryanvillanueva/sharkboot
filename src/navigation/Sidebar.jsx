import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, UserGroupIcon, ChatBubbleLeftRightIcon, ArrowLeftOnRectangleIcon, UserCircleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { QueryClient } from '@tanstack/react-query';

// Obtener el queryClient global (debe ser el mismo que en App.jsx)
const queryClient = window.__REACT_QUERY_CLIENT__ || new QueryClient();

const BACKEND = import.meta.env.VITE_API_URL ?? 'https://sharkboot-backend-production.up.railway.app';

const menu = [
  { name: 'Dashboard', path: '/', icon: <HomeIcon className="w-6 h-6" /> },
  { name: 'Assistants', path: '/assistants', icon: <UserGroupIcon className="w-6 h-6" /> },
  { name: 'Cuentas', path: '/accounts', icon: <UserCircleIcon className="w-6 h-6 text-blue-700" /> },
  { name: 'Chat', path: '/chat', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState({ name: '', email: '', plan: '' });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${BACKEND}/client/profile`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await res.json();
        setUser({
          name: data.user.name,
          email: data.user.email,
          plan: data.client.plan,
        });
      } catch {
        setUser({ name: '', email: '', plan: '' });
      }
    }
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    // Limpiar caché de React Query
    await queryClient.clear();
    // Redirigir al login
    navigate('/login', { replace: true });
  };

  return (
    <aside className={`h-screen bg-white shadow-lg flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Botón de colapsar */}
      <button
        className="p-2 focus:outline-none hover:bg-gray-100"
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Colapsar menú"
      >
        <Bars3Icon className={`w-6 h-6 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
      </button>
      {/* Menú */}
      <nav className="flex-1 mt-4 space-y-2">
        {menu.map(item => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-colors duration-200 ${location.pathname === item.path ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            {item.icon}
            {!collapsed && <span className="font-medium">{item.name}</span>}
          </Link>
        ))}
      </nav>
      {/* Usuario y logout */}
      <div className="mt-auto p-4 border-t border-gray-100">
        <button
          className="flex items-center gap-3 w-full text-left hover:bg-gray-100 p-2 rounded-lg"
          onClick={() => navigate('/profile')}
        >
          <UserCircleIcon className="w-10 h-10 text-blue-600" />
          {!collapsed && (
            <div>
              <div className="font-semibold">{user.name}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
              <div className="text-xs text-blue-600 font-bold">{user.plan}</div>
            </div>
          )}
        </button>
        <button
          className="mt-3 w-full flex items-center gap-2 text-red-600 hover:bg-red-50 p-2 rounded-lg"
          onClick={handleLogout}
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          {!collapsed && <span>Salir</span>}
        </button>
      </div>
    </aside>
  );
} 