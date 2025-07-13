import React, { useState, useRef, useEffect } from 'react';
import { PaperClipIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const BACKEND = import.meta.env.VITE_API_URL ?? 'https://sharkboot-backend-production.up.railway.app';

// Componente para bloques de código
const CodeBlock = ({ children, language = '', isEditable = true }) => {
  const [code, setCode] = useState(children);
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copiando código:', err);
    }
  };
  
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-gray-700">
      <div className="bg-gray-800 text-gray-300 px-4 py-2 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
          <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          {language && <span className="ml-2 text-blue-300">{language}</span>}
        </span>
        <button
          onClick={copyToClipboard}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
          title="Copiar código"
        >
          {copied ? '✓ Copiado' : '📋 Copiar'}
        </button>
      </div>
      
      {isEditable ? (
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full bg-gray-900 text-green-400 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ minHeight: '100px' }}
          spellCheck={false}
        />
      ) : (
        <pre className="bg-gray-900 text-green-400 p-4 font-mono text-sm overflow-x-auto">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
};

// Componente para renderizar markdown con código
const MarkdownText = ({ children }) => {
  if (!children || typeof children !== 'string') return children;
  
  const parts = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const inlineCodeRegex = /`([^`]+)`/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(children)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = children.substring(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push({ type: 'text', content: textBefore });
      }
    }
    
    parts.push({
      type: 'codeblock',
      language: match[1] || '',
      content: match[2].trim()
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < children.length) {
    const textAfter = children.substring(lastIndex);
    if (textAfter.trim()) {
      parts.push({ type: 'text', content: textAfter });
    }
  }
  
  if (parts.length === 0) {
    parts.push({ type: 'text', content: children });
  }
  
  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.type === 'codeblock') {
          return (
            <CodeBlock 
              key={index} 
              language={part.language}
              isEditable={true}
            >
              {part.content}
            </CodeBlock>
          );
        } else {
          let processedText = part.content;
          
          processedText = processedText.replace(inlineCodeRegex, '<code class="bg-gray-100 text-pink-600 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
          processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
          processedText = processedText.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">$1</h3>');
          processedText = processedText.replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-gray-800 mt-4 mb-2">$1</h2>');
          processedText = processedText.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-800 mt-4 mb-2">$1</h1>');
          processedText = processedText.replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>');
          processedText = processedText.replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4">$1. $2</li>');
          processedText = processedText.replace(/\n/g, '<br>');
          
          return (
            <div 
              key={index}
              className="leading-relaxed"
              dangerouslySetInnerHTML={{ __html: processedText }}
            />
          );
        }
      })}
    </div>
  );
};

// Componente para el efecto de escritura
const TypewriterText = ({ text, speed = 30, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);
  
  return <MarkdownText>{displayedText}</MarkdownText>;
};

export default function AssistantChat({ assistant }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [currentRunId, setCurrentRunId] = useState(null);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Pensando...');
  const [isTyping, setIsTyping] = useState(false);
  const [isTextarea, setIsTextarea] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  const loadingMessages = [
    'Pensando...',
    'Analizando datos...',
    'Generando respuesta...',
    'Procesando información...',
    'Organizando ideas...',
    'Revisando contexto...',
    'Preparando respuesta...'
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (assistant) {
      setMessages([]);
      setThreadId(null);
      setCurrentRunId(null);
      setError(null);
      setIsTyping(false);
      setInput('');
      setIsTextarea(false);
    }
  }, [assistant?.id]);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % loadingMessages.length;
          return loadingMessages[nextIndex];
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      if (!isTextarea) {
        setIsTextarea(true);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(input.length, input.length);
          }
        }, 10);
      }
      setInput(prev => prev + '\n');
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() || files.length > 0) {
        sendMessage(e);
      }
      return;
    }
    
    if (e.key === 'Escape' && isTextarea) {
      setIsTextarea(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 10);
      return;
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    if (e.target.scrollHeight <= 200) {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && files.length === 0) return;
    if (!assistant) {
      setError('No hay asistente seleccionado');
      return;
    }

    console.log('🚀 Enviando mensaje:', { input, files: files.length, assistant: assistant.id });

    const userMessage = {
      role: 'user',
      content: input,
      files: files.map(f => f.name),
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setLoadingMessage('Pensando...');
    setError(null);

    try {
      let file_ids = [];
      
      if (files.length > 0) {
        console.log('📎 Subiendo archivos...');
        setLoadingMessage('Subiendo archivos...');
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        
        const uploadResponse = await fetch(`${BACKEND}/assistants/${assistant.id}/runs/temp/files`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          file_ids = uploadData.fileIds || [];
          console.log('✅ Archivos subidos:', file_ids);
        } else {
          console.warn('⚠️ Error subiendo archivos:', uploadResponse.status);
        }
      }

      console.log('💬 Enviando mensaje a chat...');
      setLoadingMessage('Enviando mensaje...');
      
      const chatResponse = await fetch(`${BACKEND}/assistants/${assistant.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: input,
          thread_id: threadId,
          file_ids: file_ids
        })
      });

      if (!chatResponse.ok) {
        const errorData = await chatResponse.text();
        console.error('❌ Error en chat response:', chatResponse.status, errorData);
        throw new Error(`Error enviando mensaje: ${chatResponse.status}`);
      }

      const chatData = await chatResponse.json();
      console.log('✅ Chat response:', chatData);
      
      setThreadId(chatData.thread_id);
      setCurrentRunId(chatData.run_id);

      setInput('');
      setFiles([]);
      setIsTextarea(false);

      console.log('🔄 Iniciando polling...');
      setLoadingMessage('Analizando datos...');
      await pollRunStatus(chatData.run_id);

    } catch (err) {
      console.error('💥 Error completo enviando mensaje:', err);
      setError(err.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message}`,
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const pollRunStatus = async (runId) => {
    let attempts = 0;
    const maxAttempts = 60;

    const poll = async () => {
      try {
        console.log(`🔍 Polling intento ${attempts + 1}/${maxAttempts} para run:`, runId);
        
        if (attempts < 3) setLoadingMessage('Generando respuesta...');
        else if (attempts < 6) setLoadingMessage('Procesando información...');
        else if (attempts < 10) setLoadingMessage('Organizando ideas...');
        else setLoadingMessage('Finalizando respuesta...');
        
        const response = await fetch(`${BACKEND}/assistants/${assistant.id}/runs/${runId}/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error en polling:', response.status, errorText);
          throw new Error(`Error obteniendo estado del run: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Run status:', data.status, data);

        if (data.status === 'completed') {
          console.log('✅ Run completado!');
          setLoading(false);
          
          if (data.latest_messages && data.latest_messages.length > 0) {
            const assistantMessage = data.latest_messages[0];
            let content = '';
            
            if (assistantMessage.content && assistantMessage.content.length > 0) {
              const textContent = assistantMessage.content.find(c => c.type === 'text');
              if (textContent) {
                if (textContent.text && typeof textContent.text === 'object') {
                  content = textContent.text.value || 'Respuesta sin contenido';
                } else if (typeof textContent.text === 'string') {
                  content = textContent.text;
                } else {
                  content = 'Respuesta sin contenido válido';
                }
              }
            }

            console.log('💬 Iniciando efecto de escritura...');
            
            setIsTyping(true);
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: content,
              timestamp: new Date().toLocaleTimeString(),
              messageId: assistantMessage.id,
              isTyping: true
            }]);
            
          } else {
            console.warn('⚠️ Run completado pero sin mensajes');
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: 'Respuesta completada sin contenido visible',
              timestamp: new Date().toLocaleTimeString()
            }]);
          }
          
          setCurrentRunId(null);
          return;
        }

        if (data.status === 'failed' || data.status === 'cancelled') {
          const errorMsg = data.last_error?.message || `Run ${data.status}`;
          console.error('❌ Run failed/cancelled:', errorMsg);
          throw new Error(errorMsg);
        }

        if (data.status === 'requires_action') {
          console.warn('⚠️ Run requires action');
          throw new Error('El run requiere acción manual (no soportado aún)');
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          throw new Error('Timeout: El run tardó demasiado en completarse');
        }

      } catch (err) {
        console.error('💥 Error en polling:', err);
        setError(err.message);
        setLoading(false);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
          isError: true
        }]);
        setCurrentRunId(null);
      }
    };

    poll();
  };

  const cancelRun = async () => {
    if (!currentRunId || !assistant) return;

    try {
      console.log('🛑 Cancelando run:', currentRunId);
      await fetch(`${BACKEND}/assistants/${assistant.id}/runs/${currentRunId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setCurrentRunId(null);
      setLoading(false);
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Run cancelado por el usuario',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (err) {
      console.error('Error cancelando run:', err);
    }
  };

  const clearChat = () => {
    console.log('🗑️ Limpiando chat');
    setMessages([]);
    setThreadId(null);
    setCurrentRunId(null);
    setError(null);
    setIsTyping(false);
    setInput('');
    setIsTextarea(false);
  };

  if (!assistant) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Selecciona un asistente para empezar a chatear
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[700px] border rounded-lg bg-gray-50 shadow-lg">
      {/* Header del chat */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <div>
            <span className="font-semibold">{assistant.name}</span>
            {threadId && (
              <div className="text-xs text-blue-100">
                Thread: {threadId.substring(0, 8)}...
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentRunId && (
            <button
              onClick={cancelRun}
              className="text-red-200 hover:text-red-100 text-sm p-1 rounded"
              title="Cancelar run actual"
            >
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            </button>
          )}
          <button
            onClick={clearChat}
            className="text-blue-200 hover:text-white text-sm p-1 rounded"
            title="Limpiar chat"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            <div className="text-3xl mb-4">🤖</div>
            <div className="text-xl font-semibold text-gray-700">¡Hola! Soy <strong>{assistant.name}</strong></div>
            <div className="text-sm mt-2 text-gray-600 max-w-md mx-auto leading-relaxed">
              {assistant.instructions}
            </div>
            <div className="text-xs mt-4 text-gray-400 bg-gray-100 px-3 py-1 rounded-full inline-block">
              Envía un mensaje para empezar
            </div>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                : msg.isError
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : msg.role === 'system'
                    ? 'bg-gray-100 text-gray-600 border border-gray-200'
                    : 'bg-white border border-gray-200 text-gray-800 shadow-md'
            }`}>
              {msg.role === 'assistant' && msg.isTyping ? (
                <TypewriterText 
                  text={msg.content} 
                  speed={25}
                  onComplete={() => {
                    setIsTyping(false);
                    setMessages(prev => prev.map((m, idx) => 
                      idx === i ? { ...m, isTyping: false } : m
                    ));
                  }}
                />
              ) : (
                msg.role === 'assistant' ? (
                  <MarkdownText>{msg.content}</MarkdownText>
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                )
              )}
              
              {msg.files && msg.files.length > 0 && (
                <div className="mt-3 pt-2 border-t border-blue-400/20">
                  <div className="text-xs opacity-75 mb-1">📎 Archivos adjuntos:</div>
                  {msg.files.map((fileName, idx) => (
                    <div key={idx} className="text-xs opacity-75">• {fileName}</div>
                  ))}
                </div>
              )}
              <div className="text-xs opacity-60 mt-2 text-right">{msg.timestamp}</div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-gray-600 shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm font-medium">{loadingMessage}</span>
                {currentRunId && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    {currentRunId.substring(0, 8)}...
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* File attachments preview */}
      {files.length > 0 && (
        <div className="px-4 py-3 border-t bg-blue-50">
          <div className="text-xs text-blue-700 mb-2 font-medium">📎 Archivos adjuntos:</div>
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-blue-100 text-blue-800 text-xs px-3 py-2 rounded-full border border-blue-200">
                <PaperClipIcon className="w-3 h-3" />
                <span className="truncate max-w-24 font-medium">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-blue-600 hover:text-blue-800 ml-1"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="relative">
        <form onSubmit={sendMessage} className="flex items-end gap-3 p-4 border-t bg-white rounded-b-lg">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv,.ppt,.pptx,.md,.json,.xml,.zip,.rar,.7z,.tar,.gz,.rtf,.odt,.ods,.odp,.jpg,.jpeg,.png,.gif,.bmp,.svg,.webp"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 transform hover:scale-105"
            disabled={loading}
            title="Adjuntar archivos"
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>

          {isTextarea ? (
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje... (Shift+Enter para nueva línea, Enter para enviar, Esc para input simple)"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none min-h-[48px] max-h-[200px]"
              disabled={loading}
              rows={1}
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje... (Shift+Enter para múltiples líneas)"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={loading}
            />
          )}

          {isTextarea && (
            <div className="absolute -top-6 left-16 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm border">
              Modo multilínea • Esc para volver
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!input.trim() && files.length === 0)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
          >
            {loading ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <span>Enviar</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}