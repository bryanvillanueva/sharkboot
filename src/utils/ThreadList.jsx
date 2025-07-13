import React, { useState, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const BACKEND = import.meta.env.VITE_API_URL ?? 'https://sharkboot-backend-production.up.railway.app';

export default function ThreadList({ selectedAssistant, onThreadSelect, selectedThreadId }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedAssistant) {
      fetchThreads();
    }
  }, [selectedAssistant]);

  const fetchThreads = async () => {
    if (!selectedAssistant) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND}/assistants/${selectedAssistant.id}/threads`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Tomar solo los últimos 5 threads usando la estructura correcta del backend
        setThreads(data.threads ? data.threads.slice(0, 5) : []);
      } else {
        setThreads([]);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Reciente';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Hace unos minutos';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays}d`;
    }
  };

  const getThreadTitle = (thread) => {
    // Usar el thread_id como título, ya que el backend no devuelve títulos personalizados
    return `Conversación ${thread.thread_id.substring(0, 8)}...`;
  };

  if (!selectedAssistant) {
    return (
      <div className="flex-1 bg-white rounded-2xl shadow-md p-6 flex flex-col">
        <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-400" />
          Conversaciones
        </h2>
        <div className="text-gray-400 text-center mt-8">
          Selecciona un asistente para ver sus conversaciones
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-md p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-400" />
          Conversaciones
        </h2>
        <button
          onClick={fetchThreads}
          disabled={loading}
          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
          title="Actualizar conversaciones"
        >
          <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-500">Cargando...</span>
        </div>
      ) : threads.length > 0 ? (
        <div className="space-y-3 flex-1">
          {threads.map((thread) => (
            <div
              key={thread.thread_id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedThreadId === thread.thread_id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
              onClick={() => onThreadSelect(thread.thread_id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {getThreadTitle(thread)}
                  </h3>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <ClockIcon className="w-3 h-3" />
                    {formatDate(thread.last_activity)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {thread.run_count} mensaje{thread.run_count !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 mt-8">
          <div className="text-lg mb-2">💬</div>
          <div>No hay conversaciones recientes</div>
          <div className="text-sm mt-1">Inicia una nueva conversación</div>
        </div>
      )}

      {threads.length > 0 && (
        <button
          onClick={() => onThreadSelect(null)}
          className={`mt-4 w-full py-2 px-3 rounded-lg border transition-colors ${
            selectedThreadId === null
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
          }`}
        >
          Nueva conversación
        </button>
      )}
    </div>
  );
} 