import React, { useState, useRef, useEffect } from 'react';
import { PaperClipIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

const BACKEND = import.meta.env.VITE_API_URL ?? 'https://sharkboot-backend-production.up.railway.app';

export default function AssistantChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [files, setFiles] = useState([]); // Archivos adjuntos
  const [outputFiles, setOutputFiles] = useState([]); // Archivos generados por el run
  const [assistant, setAssistant] = useState(null);
  const chatEndRef = useRef(null);
  const [imageFiles, setImageFiles] = useState([]); // Imágenes
  const [docFiles, setDocFiles] = useState([]); // Documentos

  useEffect(() => {
    // Obtener el asistente seleccionado de localStorage
    const cached = localStorage.getItem('assistants');
    if (cached) {
      const parsed = JSON.parse(cached);
      // Buscar el id seleccionado en la URL o en el estado global (opcional)
      // Por ahora, usar el primero como fallback
      const selectedId = window.location.hash.replace('#', '');
      let found = parsed[0] || null;
      if (selectedId) {
        const match = parsed.find(a => a.id === selectedId);
        if (match) found = match;
      }
      setAssistant(found);
    }
  }, []);

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

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleImageChange = (e) => {
    setImageFiles(Array.from(e.target.files));
  };
  const handleDocChange = (e) => {
    setDocFiles(Array.from(e.target.files));
  };

  const allFiles = [...imageFiles, ...docFiles];

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && allFiles.length === 0) return;
    const userMsg = { role: 'user', content: input };
    setMessages(msgs => [...msgs, userMsg]);
    setInput('');
    setLoading(true);
    setOutputFiles([]);
    try {
      // 1. Crear un run vacío para obtener runId y threadId
      const runRes = await fetch(`${BACKEND}/assistants/${assistant?.id}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ message: '', file_ids: [] }),
      });
      if (!runRes.ok) throw new Error('No se pudo crear el run');
      const { runId, threadId } = await runRes.json();

      // 2. Subir archivos si hay
      let file_ids = [];
      if (allFiles.length > 0) {
        const formData = new FormData();
        allFiles.forEach(f => formData.append('files', f));
        const uploadRes = await fetch(`${BACKEND}/assistants/${assistant?.id}/runs/${runId}/files`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });
        if (!uploadRes.ok) throw new Error('Error al subir archivos');
        const uploadData = await uploadRes.json();
        file_ids = uploadData.file_ids || [];
      }

      // 3. Enviar el mensaje con los file_ids
      const msgRes = await fetch(`${BACKEND}/assistants/${assistant?.id}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ message: input, file_ids, thread_id: threadId }),
      });
      if (!msgRes.ok) throw new Error('Error al enviar el mensaje');
      const { runId: finalRunId } = await msgRes.json();

      // 4. Polling de estado
      let status = 'queued';
      let tries = 0;
      while (status !== 'completed' && status !== 'failed' && tries < 60) {
        await new Promise(r => setTimeout(r, 1500));
        const pollRes = await fetch(`${BACKEND}/assistants/${assistant?.id}/runs/${finalRunId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        if (!pollRes.ok) throw new Error('Error al consultar el estado del run');
        const pollData = await pollRes.json();
        status = pollData.status;
        tries++;
      }
      if (status !== 'completed') throw new Error('El run no se completó');

      // 5. Obtener mensajes y archivos generados
      const msgListRes = await fetch(`${BACKEND}/assistants/${assistant?.id}/runs/${finalRunId}/messages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!msgListRes.ok) throw new Error('Error al obtener la respuesta');
      const msgList = await msgListRes.json();
      const assistantMsg = msgList.find(m => m.role === 'assistant');
      setMessages(msgs => [...msgs, { role: 'assistant', content: '', streaming: true }]);
      simulateStreaming(assistantMsg?.content || '');

      // 6. Obtener archivos generados
      const outFilesRes = await fetch(`${BACKEND}/assistants/${assistant?.id}/runs/${finalRunId}/files`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (outFilesRes.ok) {
        const outFiles = await outFilesRes.json();
        setOutputFiles(outFiles);
      }
    } catch (err) {
      setMessages(msgs => [...msgs, { role: 'assistant', content: 'Error: ' + err.message }]);
    } finally {
      setLoading(false);
      setFiles([]);
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
        {outputFiles.length > 0 && (
          <div className="mt-4">
            <div className="font-semibold text-xs mb-1">Archivos generados:</div>
            <ul className="space-y-1">
              {outputFiles.map(f => (
                <li key={f.file_id} className="flex items-center gap-2">
                  <a
                    href={`${BACKEND}/assistants/${assistant?.id}/runs/${f.run_id}/files/${f.file_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    {f.filename}
                  </a>
                  <span className="text-gray-400 text-xs">({Math.round((f.bytes || 0)/1024)} KB)</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2 p-2 border-t bg-white items-center">
        <label htmlFor="img-upload" className="cursor-pointer flex items-center justify-center w-10 h-10 rounded-full hover:bg-blue-50">
          <PhotoIcon className="w-6 h-6 text-blue-500" />
          <input id="img-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} disabled={loading || streaming} />
        </label>
        <label htmlFor="doc-upload" className="cursor-pointer flex items-center justify-center w-10 h-10 rounded-full hover:bg-blue-50">
          <PaperClipIcon className="w-6 h-6 text-blue-500" />
          <input id="doc-upload" type="file" accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv,.ppt,.pptx,.md,.json,.xml,.zip,.rar,.7z,.tar,.gz,.rtf,.odt,.ods,.odp" multiple className="hidden" onChange={handleDocChange} disabled={loading || streaming} />
        </label>
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
          disabled={loading || streaming || (!input.trim() && allFiles.length === 0)}
        >
          Enviar
        </button>
      </form>
      {allFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2 pb-2">
          {imageFiles.map(f => (
            <span key={f.name} className="flex items-center bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
              <PhotoIcon className="w-4 h-4 mr-1" />{f.name}
              <button type="button" className="ml-1" onClick={() => setImageFiles(imageFiles.filter(x => x !== f))}><XMarkIcon className="w-3 h-3" /></button>
            </span>
          ))}
          {docFiles.map(f => (
            <span key={f.name} className="flex items-center bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
              <PaperClipIcon className="w-4 h-4 mr-1" />{f.name}
              <button type="button" className="ml-1" onClick={() => setDocFiles(docFiles.filter(x => x !== f))}><XMarkIcon className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
} 