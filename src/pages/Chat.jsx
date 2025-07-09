import React, { useEffect, useState } from 'react';
import AssistantChat from '../utils/AssistantChat';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default function Chat() {
  const [assistants, setAssistants] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const cached = localStorage.getItem('assistants');
    if (cached) {
      const parsed = JSON.parse(cached);
      setAssistants(parsed);
      setSelected(parsed[0] || null);
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8">
        {/* Card de asistentes */}
        <div className="flex-1 bg-white rounded-2xl shadow-md p-6 flex flex-col items-center">
          <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2"><ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-400" /> Mis asistentes</h2>
          {assistants.length > 0 ? (
            <select
              className="mb-4 border rounded px-2 py-1 w-full max-w-xs"
              value={selected?.id || ''}
              onChange={e => setSelected(assistants.find(a => a.id === e.target.value))}
            >
              {assistants.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          ) : (
            <div className="text-gray-400">No hay asistentes disponibles.</div>
          )}
          {selected && (
            <div className="w-full max-w-xs text-left bg-blue-50 border border-blue-100 rounded-lg p-4 mt-2">
              <div className="font-semibold text-blue-700">{selected.name}</div>
              <div className="text-xs text-gray-600 mt-1 mb-2">{selected.instructions}</div>
              <div className="text-xs text-gray-500">Modelo: <span className="font-mono">{selected.model}</span></div>
            </div>
          )}
        </div>
        {/* Card de chat */}
        <div className="flex-1 bg-white rounded-2xl shadow-md p-6 flex flex-col">
          <h2 className="text-xl font-bold text-blue-700 mb-4">Chat</h2>
          {selected ? (
            <AssistantChat key={selected.id} />
          ) : (
            <div className="text-gray-400">Selecciona un asistente para chatear.</div>
          )}
        </div>
      </div>
    </main>
  );
} 