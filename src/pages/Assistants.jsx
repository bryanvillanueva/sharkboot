import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AssistantList from '../utils/AssistantList';
import AssistantChat from '../utils/AssistantChat';
import ThreadList from '../utils/ThreadList';
import { getAssistants, setAssistants, migrateToUserSpecific, hasValidUserSession } from '../utils/userCache'; // ✅ Importar utilidades

const BACKEND = import.meta.env.VITE_API_URL ?? 'https://sharkboot-backend-production.up.railway.app';

export default function Assistants() {
  const [assistants, setAssistantsState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [plan, setPlan] = useState('FREE');
  
  // Estado para el orden de las cards
  const [cardOrder, setCardOrder] = useState([
    { id: 'assistant-list', component: 'AssistantList', width: 'w-80' },
    { id: 'assistant-chat', component: 'AssistantChat', width: 'flex-1' },
    { id: 'thread-list', component: 'ThreadList', width: 'w-80' }
  ]);

  useEffect(() => {
    async function fetchPlanAndAssistants() {
      try {
        console.log('🔍 Iniciando carga de asistentes...');
        
        // ✅ Verificar sesión válida
        if (!hasValidUserSession()) {
          console.warn('⚠️ Sesión inválida, redirigiendo...');
          setAssistantsState([]);
          setLoading(false);
          return;
        }

        // ✅ Migrar datos existentes al formato específico por usuario
        migrateToUserSpecific();

        // Obtener plan real del cliente
        const profileRes = await fetch(`${BACKEND}/client/profile`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const profileData = await profileRes.json();
        setPlan(profileData.client.plan || 'FREE');
        
        // ✅ Obtener asistentes específicos del usuario desde caché
        const cachedAssistants = getAssistants();
        console.log('📦 Asistentes en caché:', cachedAssistants.length);
        
        if (cachedAssistants && cachedAssistants.length > 0) {
          // Usar caché si está disponible
          setAssistantsState(cachedAssistants);
          setSelected(cachedAssistants[0] || null);
          setLoading(false);
          console.log('✅ Asistentes cargados desde caché');
          
          // Verificar si necesitamos actualizar en background
          fetchFromAPI(false); // Sin loading indicator
        } else {
          // No hay caché, cargar desde API
          console.log('🌐 No hay caché, cargando desde API...');
          await fetchFromAPI(true); // Con loading indicator
        }
        
      } catch (error) {
        console.error('❌ Error cargando asistentes:', error);
        setAssistantsState([]);
      } finally {
        setLoading(false);
      }
    }

    // ✅ Función separada para fetch desde API
    async function fetchFromAPI(showLoading = true) {
      try {
        if (showLoading) setLoading(true);
        
        const response = await fetch(`${BACKEND}/assistants`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('🌐 Asistentes desde API:', data.length);
        
        // ✅ Guardar en caché específico del usuario
        setAssistants(data);
        setAssistantsState(data);
        setSelected(data[0] || null);
        
        console.log('✅ Asistentes guardados en caché específico del usuario');
        
      } catch (error) {
        console.error('❌ Error fetching desde API:', error);
        
        // Si falla API pero tenemos caché, usarlo
        const cachedAssistants = getAssistants();
        if (cachedAssistants.length > 0) {
          console.log('📦 Usando caché como fallback');
          setAssistantsState(cachedAssistants);
          setSelected(cachedAssistants[0] || null);
        } else {
          setAssistantsState([]);
        }
      } finally {
        if (showLoading) setLoading(false);
      }
    }

    fetchPlanAndAssistants();
  }, []);

  const handleAssistantSelect = (assistant) => {
    setSelected(assistant);
    setSelectedThreadId(null); // Reset thread when changing assistant
  };

  // ✅ Función actualizada para manejar cambios en asistentes
  const handleAssistantsUpdate = (newList) => {
    console.log('🔄 Actualizando lista de asistentes:', newList.length);
    
    // Actualizar estado local
    setAssistantsState(newList);
    setSelected(newList[0] || null);
    
    // ✅ Guardar en caché específico del usuario
    setAssistants(newList);
    
    console.log('✅ Lista de asistentes actualizada y guardada en caché');
  };

  const handleThreadSelect = (threadId) => {
    setSelectedThreadId(threadId);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(cardOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCardOrder(items);
  };

  const renderCard = (card) => {
    switch (card.component) {
      case 'AssistantList':
        return (
          <div className={card.width}>
            <AssistantList 
              assistants={assistants}
              selectedAssistant={selected}
              onAssistantSelect={handleAssistantSelect}
              onAssistantsUpdate={handleAssistantsUpdate}
              plan={plan}
            />
          </div>
        );
      case 'AssistantChat':
        return (
          <div className="flex-1 bg-white rounded-2xl shadow-md p-6 flex flex-col">
            <h2 className="text-xl font-bold text-blue-700 mb-4">Chat</h2>
            {selected ? (
              <AssistantChat 
                assistant={selected} 
                threadId={selectedThreadId}
              />
            ) : (
              <div className="text-gray-400 text-center mt-12">Selecciona un asistente para chatear</div>
            )}
          </div>
        );
      case 'ThreadList':
        return (
          <div className={card.width}>
            <ThreadList
              selectedAssistant={selected}
              onThreadSelect={handleThreadSelect}
              selectedThreadId={selectedThreadId}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div>Cargando asistentes...</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-7xl">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="cards" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex gap-6"
              >
                {cardOrder.map((card, index) => (
                  <Draggable key={card.id} draggableId={card.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`${snapshot.isDragging ? 'opacity-75' : ''}`}
                      >
                        {renderCard(card)}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </main>
  );
}