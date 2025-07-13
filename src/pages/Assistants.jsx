import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AssistantList from '../utils/AssistantList';
import AssistantChat from '../utils/AssistantChat';
import ThreadList from '../utils/ThreadList';

const BACKEND = import.meta.env.VITE_API_URL ?? 'https://sharkboot-backend-production.up.railway.app';

export default function Assistants() {
  const [assistants, setAssistants] = useState(null);
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

  const handleAssistantSelect = (assistant) => {
    setSelected(assistant);
    setSelectedThreadId(null); // Reset thread when changing assistant
  };

  const handleAssistantsUpdate = (newList) => {
    setAssistants(newList);
    setSelected(newList[0] || null);
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
    return <div className="flex justify-center items-center h-full">Cargando...</div>;
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