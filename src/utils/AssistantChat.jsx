import React, { useState, useRef } from 'react';

const BACKEND = import.meta.env.VITE_API_URL ?? 'https://sharkboot-backend-production.up.railway.app';

export default function AssistantChat({ assistant }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const chatEndRef = useRef(null);

  // Simula el tipeo de tokens
  const simulateStreaming = (fullText, onDone) => {
    setStreaming(true);
    let i = 0;
    let current = '';
    const interval = setInterval(() => {
      if (i < fullText.length) {
        current += fullText[i];
        setMessages(msgs => {
          const last = msgs[msgs.length - 1];
          return [
            ...msgs.slice(0, -1),
            { ...last, content: current, streaming: true },
          ];
        });
        i++;
      } else {
        clearInterval(interval);
        setStreaming(false);
        if (onDone) onDone();
      }
    }, 15); // velocidad de "tokens"
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(msgs => [...msgs, userMsg]);
    setInput('');
    setLoading(true);
    try {
      // Simulación: POST a /assistants/:id/chat (ajusta si tu endpoint es diferente)
      const res = await fetch(`${BACKEND}/assistants/${assistant.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      if (!res.ok) throw new Error('Error al consultar el asistente');
      const data = await res.json();
      // data.response es el texto completo
      setMessages(msgs => [...msgs, { role: 'assistant', content: '', streaming: true }]);
      simulateStreaming(data.response);
    } catch (err) {
      setMessages(msgs => [...msgs, { role: 'assistant', content: 'Error: ' + err.message }]);
    } finally {
      setLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[500px] border rounded-lg bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-3 py-2 rounded-lg max-w-xs ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'} ${msg.streaming ? 'animate-pulse' : ''}`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2 p-2 border-t bg-white">
        <input
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          disabled={loading || streaming}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          disabled={loading || streaming || !input.trim()}
        >
          Enviar
        </button>
      </form>
    </div>
  );
} 