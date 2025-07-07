import React, { useEffect, useState } from 'react';
import { PlusCircleIcon, PencilSquareIcon, TrashIcon, ChatBubbleLeftRightIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import AssistantModal from '../modals/AssistantModal';
import KnowledgeModal from '../modals/KnowledgeModal';
import AssistantChat from '../utils/AssistantChat';

const BACKEND = import.meta.env.VITE_API_URL ?? 'https://sharkboot-backend-production.up.railway.app';

const PLAN_LIMITS = {
  FREE: 1,
  STARTER: 3,
  PRO: 5,
  ENTERPRISE: 20, 
};

export default function Assistants() {
  const [assistants, setAssistants] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAssistant, setEditAssistant] = useState(null);
  const [selected, setSelected] = useState(null);
  const [plan, setPlan] = useState('FREE');
  const [showKnowledge, setShowKnowledge] = useState(false);

  useEffect(() => {
    async function fetchPlanAndAssistants() {
      try {
        // Obtener plan real del cliente
        const profileRes = await fetch(`${BACKEND}/client/profile`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const profileData = await profileRes.json();
        setPlan(profileData.client.plan || 'FREE');
      } catch {
        setPlan('FREE');
      }
      // Obtener asistentes (de cache o API)
      const cached = localStorage.getItem('assistants');
      if (cached) {
        const parsed = JSON.parse(cached);
        setAssistants(parsed);
        setSelected(parsed[0] || null);
        setLoading(false);
      } else {
        fetch(`${BACKEND}/assistants`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })
          .then(res => res.json())
          .then(data => {
            setAssistants(data);
            setSelected(data[0] || null);
            localStorage.setItem('assistants', JSON.stringify(data));
          })
          .catch(() => setAssistants([]))
          .finally(() => setLoading(false));
      }
    }
    fetchPlanAndAssistants();
  }, []);

  const handleCreated = (newList) => {
    setAssistants(newList);
    setSelected(newList[0] || null);
  };

  const handleEdit = (assistant) => {
    setEditAssistant(assistant);
    setShowModal(true);
  };

  const handleDelete = async (assistant) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el asistente "${assistant.name}"?`)) return;
    await fetch(`${BACKEND}/assistants/${assistant.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    const newList = assistants.filter(a => a.id !== assistant.id);
    setAssistants(newList);
    setSelected(newList[0] || null);
    localStorage.setItem('assistants', JSON.stringify(newList));
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditAssistant(null);
  };

  const limit = PLAN_LIMITS[plan] ?? 1;
  const canAdd = !assistants || assistants.length < limit;

  if (loading) {
    return <div className="flex justify-center items-center h-full">Cargando...</div>;
  }

  if (!assistants || assistants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <button className="flex flex-col items-center text-blue-600 hover:text-blue-800" onClick={() => setShowModal(true)} disabled={!canAdd}>
          <PlusCircleIcon className="w-16 h-16 mb-2" />
          <span className="text-lg font-semibold">Agregar asistente</span>
          {!canAdd && <span className="text-xs text-gray-400 mt-1">Límite alcanzado para tu plan</span>}
        </button>
        <AssistantModal open={showModal} onClose={handleModalClose} onCreated={handleCreated} />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-md p-8 flex gap-8">
        <div className="w-1/2">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">Mis asistentes</h2>
          <ul className="space-y-4">
            {assistants.map(a => (
              <li key={a.id} className={`border rounded-lg p-4 flex flex-col gap-2 cursor-pointer ${selected && selected.id === a.id ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => setSelected(a)}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-400" />
                    {a.name}
                  </span>
                  <div className="flex gap-2">
                    <button title="Editar" onClick={e => { e.stopPropagation(); handleEdit(a); }} className="text-blue-600 hover:text-blue-800 p-1"><PencilSquareIcon className="w-5 h-5" /></button>
                    <button title="Eliminar" onClick={e => { e.stopPropagation(); handleDelete(a); }} className="text-red-600 hover:text-red-800 p-1"><TrashIcon className="w-5 h-5" /></button>
                  </div>
                </div>
                <span className="text-gray-500 text-sm">{a.instructions}</span>
                {selected && selected.id === a.id && (
                  <button
                    className="mt-2 flex items-center gap-1 text-blue-600 hover:underline text-sm w-fit"
                    onClick={e => { e.stopPropagation(); setShowKnowledge(true); }}
                  >
                    <DocumentMagnifyingGlassIcon className="w-4 h-4" /> Ver base de conocimiento
                  </button>
                )}
              </li>
            ))}
          </ul>
          <button className="mt-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 disabled:opacity-50" onClick={() => setShowModal(true)} disabled={!canAdd}>
            <PlusCircleIcon className="w-6 h-6" />
            <span>Agregar asistente</span>
            {!canAdd && <span className="text-xs text-gray-400 ml-2">Límite alcanzado para tu plan</span>}
          </button>
          <AssistantModal open={showModal} onClose={handleModalClose} onCreated={handleCreated} assistant={editAssistant} />
          <KnowledgeModal open={showKnowledge} onClose={() => setShowKnowledge(false)} assistant={selected} />
        </div>
        <div className="w-1/2 flex flex-col">
          {selected ? (
            <>
              <h3 className="text-lg font-semibold mb-2">Probar asistente: <span className="text-blue-700">{selected.name}</span></h3>
              <AssistantChat assistant={selected} />
            </>
          ) : (
            <div className="text-gray-400 text-center mt-12">Selecciona un asistente para probarlo</div>
          )}
        </div>
      </div>
    </main>
  );
} 