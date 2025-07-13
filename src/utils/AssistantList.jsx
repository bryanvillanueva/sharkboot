import React, { useState } from 'react';
import { PlusCircleIcon, PencilSquareIcon, TrashIcon, ChatBubbleLeftRightIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import AssistantModal from '../modals/AssistantModal';
import KnowledgeModal from '../modals/KnowledgeModal';

const BACKEND = import.meta.env.VITE_API_URL ?? 'https://sharkboot-backend-production.up.railway.app';

const PLAN_LIMITS = {
  FREE: 1,
  STARTER: 3,
  PRO: 5,
  ENTERPRISE: 20, 
};

export default function AssistantList({ assistants, selectedAssistant, onAssistantSelect, onAssistantsUpdate, plan }) {
  const [showModal, setShowModal] = useState(false);
  const [editAssistant, setEditAssistant] = useState(null);
  const [showKnowledge, setShowKnowledge] = useState(false);

  const handleCreated = (newList) => {
    onAssistantsUpdate(newList);
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
    onAssistantsUpdate(newList);
    localStorage.setItem('assistants', JSON.stringify(newList));
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditAssistant(null);
  };

  const limit = PLAN_LIMITS[plan] ?? 1;
  const canAdd = !assistants || assistants.length < limit;

  if (!assistants || assistants.length === 0) {
    return (
      <div className="flex-1 bg-white rounded-2xl shadow-md p-6 flex flex-col items-center justify-center">
        <button 
          className="flex flex-col items-center text-blue-600 hover:text-blue-800" 
          onClick={() => setShowModal(true)} 
          disabled={!canAdd}
        >
          <PlusCircleIcon className="w-16 h-16 mb-2" />
          <span className="text-lg font-semibold">Agregar asistente</span>
          {!canAdd && <span className="text-xs text-gray-400 mt-1">Límite alcanzado para tu plan</span>}
        </button>
        <AssistantModal open={showModal} onClose={handleModalClose} onCreated={handleCreated} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-md p-6 flex flex-col">
      <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
        <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-400" /> 
        Mis asistentes
      </h2>
      
      <ul className="space-y-4 flex-1">
        {assistants.map(a => (
          <li 
            key={a.id} 
            className={`border rounded-lg p-4 flex flex-col gap-2 cursor-pointer transition-colors ${
              selectedAssistant && selectedAssistant.id === a.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => onAssistantSelect(a)}
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-400" />
                {a.name}
              </span>
              <div className="flex gap-2">
                <button 
                  title="Editar" 
                  onClick={e => { e.stopPropagation(); handleEdit(a); }} 
                  className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                >
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
                <button 
                  title="Eliminar" 
                  onClick={e => { e.stopPropagation(); handleDelete(a); }} 
                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <span className="text-gray-500 text-sm line-clamp-2">{a.instructions}</span>
            {selectedAssistant && selectedAssistant.id === a.id && (
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
      
      <button 
        className="mt-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 disabled:opacity-50 p-2 rounded hover:bg-blue-50" 
        onClick={() => setShowModal(true)} 
        disabled={!canAdd}
      >
        <PlusCircleIcon className="w-6 h-6" />
        <span>Agregar asistente</span>
        {!canAdd && <span className="text-xs text-gray-400 ml-2">Límite alcanzado para tu plan</span>}
      </button>
      
      <AssistantModal open={showModal} onClose={handleModalClose} onCreated={handleCreated} assistant={editAssistant} />
      <KnowledgeModal open={showKnowledge} onClose={() => setShowKnowledge(false)} assistant={selectedAssistant} />
    </div>
  );
} 