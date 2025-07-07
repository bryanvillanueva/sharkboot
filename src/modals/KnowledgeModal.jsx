import React, { useEffect, useState, useRef } from 'react';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

const BACKEND = import.meta.env.VITE_API_URL ?? 'https://sharkboot-backend-production.up.railway.app';

export default function KnowledgeModal({ open, onClose, assistant }) {
  const [files, setFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    if (open && assistant) {
      fetch(`${BACKEND}/assistants/${assistant.id}/files`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      })
        .then(res => res.json())
        .then(setFiles)
        .catch(() => setFiles([]));
      setPendingFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, assistant]);

  const handleFileSelect = (e) => {
    const filesToAdd = Array.from(e.target.files);
    if (!filesToAdd.length) return;
    setFileError(null);
    setPendingFiles(prev => [...prev, ...filesToAdd]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePending = (name) => {
    setPendingFiles(prev => prev.filter(f => f.name !== name));
  };

  const handleUploadPending = async () => {
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
    } catch (err) {
      setFileError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
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

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><DocumentMagnifyingGlassIcon className="w-6 h-6 text-blue-600" />Base de conocimiento</h2>
        <div className="text-xs text-gray-500 mb-2">Puedes cargar archivos PDF, TXT, DOCX, etc. para que el asistente los use como base de conocimiento. El vector store se crea automáticamente al subir el primer documento.</div>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          className="mb-2"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        {pendingFiles.length > 0 && (
          <div className="mb-2">
            <div className="text-xs font-semibold mb-1">Archivos pendientes de cargar:</div>
            <ul className="space-y-1 mb-2">
              {pendingFiles.map(f => (
                <li key={f.name} className="flex items-center justify-between bg-yellow-50 rounded px-3 py-1">
                  <span className="truncate max-w-xs">{f.name}</span>
                  <button type="button" className="text-red-600 hover:text-red-800 text-xs" onClick={() => handleRemovePending(f.name)} disabled={uploading}>Quitar</button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="bg-blue-600 text-white px-4 py-1 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
              onClick={handleUploadPending}
              disabled={uploading}
            >
              Cargar archivos
            </button>
          </div>
        )}
        {fileError && <div className="text-red-600 text-xs mb-2">{fileError}</div>}
        <ul className="space-y-2 mb-2">
          {files.map(f => (
            <li key={f.fileId} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
              <span className="truncate max-w-xs">{f.filename}</span>
              <button type="button" className="text-red-600 hover:text-red-800 text-xs" onClick={() => handleDeleteFile(f.fileId)} disabled={uploading}>Eliminar</button>
            </li>
          ))}
          {files.length === 0 && <li className="text-xs text-gray-400">No hay documentos cargados.</li>}
        </ul>
      </div>
    </div>
  );
} 