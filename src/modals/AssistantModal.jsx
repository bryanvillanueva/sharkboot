import React, { useState, useEffect, useRef } from 'react';
import { QuestionMarkCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const BACKEND = import.meta.env.VITE_API_URL ?? 'https://sharkboot-backend-production.up.railway.app';

function Toggle({ checked, onChange, label, tooltip, disabled, lockIcon }) {
  return (
    <div className="flex items-center gap-2 group relative select-none">
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors duration-200 flex items-center border ${checked ? (disabled ? 'bg-blue-200 border-blue-200' : 'bg-blue-600 border-blue-600') : (disabled ? 'bg-gray-200 border-gray-200' : 'bg-gray-300 border-gray-300')} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        aria-pressed={checked}
        disabled={disabled}
      >
        <span className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'} ${disabled ? 'border border-gray-300' : ''}`}></span>
        {lockIcon && disabled && (
          <LockClosedIcon className="w-4 h-4 text-gray-400 absolute left-1 top-1" />
        )}
      </button>
      <span className="text-sm flex items-center gap-1">
        {label}
        {tooltip && (
          <span className="relative group">
            <QuestionMarkCircleIcon className="w-4 h-4 text-blue-500 cursor-pointer" />
            <span className="absolute left-6 top-0 z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-pre-line pointer-events-none min-w-max max-w-xs break-words shadow-lg">
              {tooltip}
            </span>
          </span>
        )}
      </span>
    </div>
  );
}

export default function AssistantModal({ open, onClose, onCreated, assistant }) {
  const [form, setForm] = useState({
    name: '',
    instructions: '',
    model: 'gpt-4o-mini',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState(null);
  const fileInputRef = useRef();
  // Toggles para tools
  const [enableCodeInterpreter, setEnableCodeInterpreter] = useState(true);
  const [enableFileSearch, setEnableFileSearch] = useState(true); // Cambiado a true por defecto
  const [showFiles, setShowFiles] = useState(false);

  useEffect(() => {
    if (assistant) {
      setForm({
        name: assistant.name || '',
        instructions: assistant.instructions || '',
        model: assistant.model || 'gpt-4o-mini',
      });
      fetch(`${BACKEND}/assistants/${assistant.id}/files`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      })
        .then(res => res.json())
        .then(setFiles)
        .catch(() => setFiles([]));
      let cfg = {};
      try {
        cfg = assistant.tool_config ? JSON.parse(assistant.tool_config) : {};
      } catch {}
      setEnableCodeInterpreter(!!cfg.code_interpreter || Object.keys(cfg).length === 0);
      setEnableFileSearch(!!cfg.file_search);
      setPendingFiles([]);
    } else {
      setForm({ name: '', instructions: '', model: 'gpt-4o-mini' });
      setFiles([]);
      setEnableCodeInterpreter(true);
      setEnableFileSearch(false);
      setPendingFiles([]);
    }
    setShowFiles(false);
  }, [assistant, open]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Construir tool_config según toggles
      let tool_config = {};
      if (enableCodeInterpreter) tool_config.code_interpreter = {};
      if (enableFileSearch) tool_config.file_search = {};
      let payload = {
        ...form,
        tool_config: Object.keys(tool_config).length > 0 ? tool_config : undefined,
      };
      let res, data;
      if (assistant) {
        // PATCH para editar
        res = await fetch(`${BACKEND}/assistants/${assistant.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('No se pudo editar el asistente');
        data = await res.json();
        // Actualizar localStorage
        let assistants = JSON.parse(localStorage.getItem('assistants') || '[]');
        assistants = assistants.map(a => a.id === assistant.id ? { ...a, ...form, tool_config: JSON.stringify(tool_config) } : a);
        localStorage.setItem('assistants', JSON.stringify(assistants));
        onCreated(assistants);
      } else {
        // POST para crear
        res = await fetch(`${BACKEND}/assistants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('No se pudo crear el asistente');
        data = await res.json();
        let assistants = JSON.parse(localStorage.getItem('assistants') || '[]');
        assistants.push({
          id: data.id,
          openai_id: data.openai_id,
          name: form.name,
          instructions: form.instructions,
          tool_config: JSON.stringify(tool_config),
        });
        localStorage.setItem('assistants', JSON.stringify(assistants));
        onCreated(assistants);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Documentos (edición y creación) ---
  const handleFileUpload = (e) => {
    const filesToAdd = Array.from(e.target.files);
    if (!filesToAdd.length) return;
    setFileError(null);
    setPendingFiles(prev => [...prev, ...filesToAdd]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (fileIdOrName) => {
    setFiles(prev => prev.filter(f => (f.fileId || f.name) !== fileIdOrName));
    setPendingFiles(prev => prev.filter(f => f.name !== fileIdOrName));
  };

  // Solo para edición: subir/borrar archivos en backend
  const handleUploadEdit = async () => {
    if (!pendingFiles.length) return;
    setUploading(true);
    setFileError(null);
    const formData = new FormData();
    for (const f of pendingFiles) formData.append('files', f);
    try {
      const res = await fetch(`${BACKEND}/assistants/${assistant.id}/files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error('Error al subir archivos');
      const filesRes = await fetch(`${BACKEND}/assistants/${assistant.id}/files`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      setFiles(await filesRes.json());
      setPendingFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setFileError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFileEdit = async (fileId) => {
    if (!window.confirm('¿Eliminar este archivo?')) return;
    setUploading(true);
    setFileError(null);
    try {
      await fetch(`${BACKEND}/assistants/${assistant.id}/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      setFiles(files.filter(f => f.fileId !== fileId));
    } catch (err) {
      setFileError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">{assistant ? 'Editar asistente' : 'Crear asistente'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input name="name" value={form.name} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Instrucciones *</label>
            <textarea name="instructions" value={form.instructions} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Modelo</label>
            <select
              name="model"
              value={form.model}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="gpt-4.1-mini">gpt-4.1-mini</option>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4.5-turbo">gpt-3.5-turbo</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <Toggle
              checked={enableCodeInterpreter}
              onChange={() => {}}
              label={"Activar Code Interpreter (análisis de datos, gráficos, cálculos, Python)"}
              tooltip={"Permite al asistente analizar datos, crear gráficos y ejecutar código Python de forma segura. Recomendado para asistentes avanzados."}
              disabled={true}
              lockIcon={true}
            />
            <Toggle
              checked={enableFileSearch}
              onChange={setEnableFileSearch}
              label={"¿Vas a cargar documentos para la base de información?"}
              tooltip={"Activa esta opción si quieres que el asistente pueda buscar información en los documentos que subas aquí. Útil para asistentes que deben responder usando información de tu empresa, manuales, PDFs, etc."}
              disabled={false}
            />
          </div>
          {enableFileSearch && (
            <div className="mt-4 border-t pt-4">
              <Toggle
                checked={showFiles}
                onChange={setShowFiles}
                label="¿Quieres cargar documentos ahora o después?"
                tooltip="Puedes cargar documentos ahora o hacerlo después desde el chat. Esto solo muestra u oculta la sección de carga."
                disabled={false}
              />
              {showFiles && (
                <div className="mt-4 border-t pt-4">
                  <div>
                    <div className="font-semibold mb-2">Base de conocimiento (documentos)</div>
                    <div className="text-xs text-gray-500 mb-2">Puedes cargar archivos PDF, TXT, DOCX, etc. para que el asistente los use como base de conocimiento. El vector store se crea automáticamente al subir el primer documento.</div>
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      className="mb-2 hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      id="custom-file-upload"
                    />
                    <label htmlFor="custom-file-upload" className="inline-block bg-blue-50 border border-blue-300 text-blue-700 px-4 py-2 rounded-lg cursor-pointer font-semibold hover:bg-blue-100 transition mb-2">
                      {pendingFiles.length > 0 ? 'Agregar más archivos' : 'Seleccionar archivos'}
                    </label>
                    {pendingFiles.length === 0 && files.length === 0 && (
                      <div className="text-xs text-gray-400 mb-2">No hay documentos cargados.</div>
                    )}
                    {pendingFiles.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs font-semibold mb-1">Archivos pendientes de cargar:</div>
                        <ul className="space-y-1 mb-2">
                          {pendingFiles.map(f => (
                            <li key={f.name} className="flex items-center justify-between bg-yellow-50 rounded px-3 py-1">
                              <span className="truncate max-w-xs">{f.name}</span>
                              <button type="button" className="text-red-600 hover:text-red-800 text-xs" onClick={() => handleRemoveFile(f.name)} disabled={uploading}>Quitar</button>
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          className="bg-blue-600 text-white px-4 py-1 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
                          onClick={handleUploadEdit}
                          disabled={uploading}
                        >
                          Cargar archivos
                        </button>
                      </div>
                    )}
                    {fileError && <div className="text-red-600 text-xs mb-2">{fileError}</div>}
                    <ul className="space-y-2 mb-2">
                      {files.map(f => (
                        <li key={f.fileId || f.name} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                          <span className="truncate max-w-xs">{f.filename || f.name}</span>
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-800 text-xs"
                            onClick={() => handleDeleteFileEdit(f.fileId)}
                            disabled={uploading}
                          >Eliminar</button>
                        </li>
                      ))}
                      {files.length === 0 && <li className="text-xs text-gray-400">No hay documentos cargados.</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
            {loading ? (assistant ? 'Guardando...' : 'Creando...') : (assistant ? 'Guardar cambios' : 'Crear')}
          </button>
        </form>
      </div>
    </div>
  );
} 