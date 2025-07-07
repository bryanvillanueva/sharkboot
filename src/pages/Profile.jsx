import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL ?? 'https://sharkboot-backend-production.up.railway.app';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch(`${BACKEND}/client/profile`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          }),
          fetch(`${BACKEND}/client/stats`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          })
        ]);
        const profileData = await profileRes.json();
        const statsData = await statsRes.json();
        setProfile(profileData);
        setStats(statsData);
      } catch {
        setProfile(null);
        setStats(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-full">Cargando perfil...</div>;
  if (!profile) return <div className="text-center text-red-500">No se pudo cargar el perfil.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">Perfil de usuario</h2>
        <div className="mb-6">
          <div className="font-semibold text-lg">{profile.user.name}</div>
          <div className="text-gray-600">{profile.user.email}</div>
          <div className="text-gray-500 text-sm">{profile.user.role} | {profile.user.city}, {profile.user.country}</div>
        </div>
        <div className="mb-6">
          <div className="font-semibold">Empresa: {profile.client.name}</div>
          <div className="text-gray-500 text-sm">Plan: <span className="font-bold text-blue-600">{profile.client.plan}</span></div>
          <div className="text-gray-500 text-sm">Miembro desde: {new Date(profile.client.created_at).toLocaleDateString()}</div>
        </div>
        {stats && (
          <div className="mb-6">
            <div className="font-semibold mb-2">Estadísticas</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-xs text-gray-500">Asistentes</div>
                <div className="text-xl font-bold">{stats.assistants}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-xs text-gray-500">Miembros</div>
                <div className="text-xl font-bold">{stats.members}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 col-span-2">
                <div className="text-xs text-gray-500">Uso tokens</div>
                <div className="text-sm">Prompt: <span className="font-semibold">{stats.usage.prompt_tokens}</span> | Completion: <span className="font-semibold">{stats.usage.completion_tokens}</span></div>
                <div className="text-xs text-gray-500 mt-1">Costo: <span className="font-semibold">${stats.usage.cost_usd}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 