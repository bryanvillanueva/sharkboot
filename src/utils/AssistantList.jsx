import React, { useState } from 'react';
import { 
  PlusCircleIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentMagnifyingGlassIcon,
  CodeBracketIcon,
  ArrowsPointingOutIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import AssistantModal from '../modals/AssistantModal';
import KnowledgeModal from '../modals/KnowledgeModal';
import { setAssistants } from './userCache'; // ✅ Importar utilidad

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
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [currentInstructions, setCurrentInstructions] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCreated = (updatedAssistants) => {
    console.log('📝 Lista de asistentes actualizada desde modal');
    
    // Actualizar la lista completa de asistentes
    onAssistantsUpdate(updatedAssistants);
    
    // Si estamos editando, seleccionar el asistente actualizado
    if (editAssistant) {
      const updated = updatedAssistants.find(a => a.id === editAssistant.id);
      if (updated) {
        onAssistantSelect(updated);
      }
    }
    setIsDropdownOpen(false);
  };

  const handleEdit = (assistant) => {
    setEditAssistant(assistant);
    setShowModal(true);
    setIsDropdownOpen(false);
  };

  const handleDelete = async (assistant) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el asistente "${assistant.name}"?`)) return;
    
    try {
      console.log('🗑️ Eliminando asistente:', assistant.id);
      
      await fetch(`${BACKEND}/assistants/${assistant.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      const newList = assistants.filter(a => a.id !== assistant.id);
      
      // ✅ Actualizar caché específico del usuario
      setAssistants(newList);
      onAssistantsUpdate(newList);
      
      // Si eliminamos el asistente seleccionado, lo deseleccionamos
      if (selectedAssistant && selectedAssistant.id === assistant.id) {
        onAssistantSelect(null);
      }
      
      console.log('✅ Asistente eliminado y caché actualizado');
    } catch (error) {
      console.error('❌ Error al eliminar asistente:', error);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditAssistant(null);
  };

  const handleViewInstructions = (instructions) => {
    setCurrentInstructions(instructions);
    setShowInstructionsModal(true);
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
        <AssistantModal 
          open={showModal} 
          onClose={handleModalClose} 
          onCreated={handleCreated} 
        />
      </div>
    );
  }

  const getToolConfig = (assistant) => {
    try {
      return assistant.tool_config ? JSON.parse(assistant.tool_config) : {};
    } catch (e) {
      console.error("Error parsing tool_config", e);
      return {};
    }
  };

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-md p-6 flex flex-col">
      <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
        <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-400" /> 
        Mis asistentes
      </h2>
      
      {/* Selector desplegable */}
      <div className="relative mb-4">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
        >
          <span className="font-medium">
            {selectedAssistant ? selectedAssistant.name : 'Selecciona un asistente'}
          </span>
          {isDropdownOpen ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>
        
        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {assistants.map(a => (
              <div
                key={a.id}
                className={`p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center ${
                  selectedAssistant && selectedAssistant.id === a.id ? 'bg-blue-100' : ''
                }`}
                onClick={() => {
                  onAssistantSelect(a);
                  setIsDropdownOpen(false);
                }}
              >
                <span>{a.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(a);
                    }}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(a);
                    }}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Opción para crear nuevo asistente */}
            <div
              className="p-3 border-t hover:bg-blue-50 cursor-pointer flex items-center gap-2 text-blue-600"
              onClick={() => {
                setShowModal(true);
                setIsDropdownOpen(false);
              }}
              disabled={!canAdd}
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>Crear nuevo asistente</span>
              {!canAdd && <span className="text-xs text-gray-400 ml-2">Límite alcanzado</span>}
            </div>
          </div>
        )}
      </div>

      {/* Detalles del asistente seleccionado */}
      {selectedAssistant && (
        <div className="border rounded-lg p-4 flex flex-col gap-3 mb-4">
          {/* Encabezado con nombre y acciones */}
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">{selectedAssistant.name}</span>
            <div className="flex gap-2">
              <button 
                title="Editar" 
                onClick={() => handleEdit(selectedAssistant)} 
                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </button>
              <button 
                title="Eliminar" 
                onClick={() => handleDelete(selectedAssistant)} 
                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Área de instrucciones */}
          <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-500">Instrucciones del sistema:</span>
              <button 
                onClick={() => handleViewInstructions(selectedAssistant.instructions)}
                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                title="Ver completo"
              >
                <ArrowsPointingOutIcon className="w-4 h-4" />
              </button>
            </div>
            <div 
              className="text-gray-700 text-sm whitespace-pre-line overflow-y-auto max-h-20 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            >
              {selectedAssistant.instructions}
            </div>
          </div>

          {/* Sección de Modelo */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <CodeBracketIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Modelo</p>
              <p className="text-sm font-medium">{selectedAssistant.model || 'gpt-4o-mini'}</p>
            </div>
          </div>

          {/* Sección de Herramientas */}
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">HERRAMIENTAS</h4>
            
            <div className="space-y-2">
              {/* File Search */}
              <div className="flex items-center gap-2">
                {getToolConfig(selectedAssistant).file_search ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircleIcon className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm">File Search</span>
              </div>

              {/* Code Interpreter */}
              <div className="flex items-center gap-2">
                {getToolConfig(selectedAssistant).code_interpreter ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircleIcon className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm">Code Interpreter</span>
              </div>
            </div>
          </div>

          {/* Base de conocimiento */}
          <button
            className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm w-fit py-1 px-2 rounded hover:bg-blue-50"
            onClick={() => setShowKnowledge(true)}
          >
            <DocumentMagnifyingGlassIcon className="w-4 h-4" />
            <span>Ver base de conocimiento</span>
          </button>
        </div>
      )}

      {/* Botón para agregar nuevo asistente (alternativo) */}
      {!selectedAssistant && (
        <button 
          className="mt-4 flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 disabled:opacity-50 p-2 rounded-lg border border-blue-300 hover:border-blue-400 hover:bg-blue-50 transition-colors" 
          onClick={() => setShowModal(true)} 
          disabled={!canAdd}
        >
          <PlusCircleIcon className="w-5 h-5" />
          <span className="font-medium">Agregar asistente</span>
          {!canAdd && <span className="text-xs text-gray-400 ml-2">Límite alcanzado</span>}
        </button>
      )}

      {/* Modal para instrucciones completas */}
      {showInstructionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-200">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-semibold text-gray-800">Instrucciones completas</h3>
              <button 
                onClick={() => setShowInstructionsModal(false)} 
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed">
                {currentInstructions}
              </pre>
            </div>
            <div className="border-t p-3 flex justify-end bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      
      <AssistantModal 
        open={showModal} 
        onClose={handleModalClose} 
        onCreated={handleCreated} 
        assistant={editAssistant} 
      />
      <KnowledgeModal 
        open={showKnowledge} 
        onClose={() => setShowKnowledge(false)} 
        assistant={selectedAssistant} 
      />
    </div>
  );
}