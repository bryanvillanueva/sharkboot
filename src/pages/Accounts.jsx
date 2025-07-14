// Actualización del componente Accounts.jsx
import React, { useState, useEffect } from 'react';
import AccountCard from '../utils/AccountCard';
import { FaFacebook, FaWhatsapp } from 'react-icons/fa';

const BACKEND = import.meta.env.VITE_API_URL ?? 'https://sharkboot-backend-production.up.railway.app';

export default function Accounts() {
  // Facebook state
  const [fbStatus, setFbStatus] = useState(null);
  const [fbLoading, setFbLoading] = useState(false);

  // WhatsApp (solo visual, no info)
  const waStatus = { linked: false };

  // Facebook logic
  const checkFbStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setFbLoading(true);
    try {
      const response = await fetch(`${BACKEND}/auth/facebook/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setFbStatus(data);
    } catch (error) {
      console.error('Error verificando estado de Facebook:', error);
      setFbStatus(null);
    } finally {
      setFbLoading(false);
    }
  };

  useEffect(() => {
    checkFbStatus();
  }, []);

  // ✅ FUNCIÓN ACTUALIZADA para pasar token como query parameter
  const linkFacebook = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes estar logueado para vincular Facebook');
      return;
    }
    
    setFbLoading(true);
    
    // ✅ PASAR TOKEN COMO QUERY PARAMETER en lugar de header
    const linkUrl = `${BACKEND}/auth/facebook/link?frontend_url=${encodeURIComponent(window.location.origin)}&token=${encodeURIComponent(token)}`;
    
    console.log('🔗 Redirigiendo a:', linkUrl);
    window.location.href = linkUrl;
  };

  const unlinkFacebook = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes estar logueado');
      return;
    }
    
    if (!confirm('¿Estás seguro de que quieres desvincular Facebook?')) {
      return;
    }
    
    setFbLoading(true);
    try {
      const response = await fetch(`${BACKEND}/auth/facebook/unlink`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Facebook desvinculado correctamente');
        setFbStatus({ linked: false });
        checkFbStatus(); // Refrescar estado
      } else {
        alert('Error al desvincular Facebook');
      }
    } catch (error) {
      console.error('Error desvinculando Facebook:', error);
      alert('Error al desvincular Facebook');
    } finally {
      setFbLoading(false);
    }
  };

  // ✅ MANEJAR ERRORES DE RETORNO EN LA URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
      let errorMessage = 'Error desconocido';
      switch (error) {
        case 'no_token':
          errorMessage = 'No se encontró token de autenticación';
          break;
        case 'invalid_token':
          errorMessage = 'Token de autenticación inválido';
          break;
        case 'link_failed':
          errorMessage = 'Error al vincular Facebook';
          break;
      }
      
      alert(errorMessage);
      
      // Limpiar URL
      window.history.replaceState({}, document.title, '/accounts');
    }
    
    // ✅ DETECTAR SI SE VINCULÓ EXITOSAMENTE
    const facebookLinked = urlParams.get('facebook_linked');
    if (facebookLinked === 'true') {
      alert('¡Facebook vinculado exitosamente!');
      // Limpiar URL y refrescar estado
      window.history.replaceState({}, document.title, '/accounts');
      checkFbStatus();
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full mx-auto">
        <h2 className="text-2xl font-bold text-blue-700 mb-6">Cuentas conectadas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 justify-center">
          <AccountCard
            icon={<FaFacebook size={40} color="#1877F2" />}
            name="Facebook"
            color="#1877F2"
            status={fbStatus?.linked ? 'Vinculado' : 'No vinculado'}
            details={fbStatus?.linked ? [
              `Facebook ID: ${fbStatus.facebook_id}`,
              `Vinculado el: ${fbStatus.linked_at ? new Date(fbStatus.linked_at).toLocaleDateString() : ''}`
            ] : [
              'Sin acceso a páginas',
              'Sin gestión de anuncios',
              'Sin WhatsApp Business'
            ]}
            loading={fbLoading}
            onLink={linkFacebook}
            onUnlink={unlinkFacebook}
            linked={!!fbStatus?.linked}
            roundedButtons
          />
          <AccountCard
            icon={<FaWhatsapp size={40} color="#25D366" />}
            name="WhatsApp"
            color="#25D366"
            status={waStatus.linked ? 'Vinculado' : 'No vinculado'}
            details={[
              'Próximamente disponible',
              'Mensajería automática',
              'Gestión de contactos'
            ]}
            loading={false}
            linked={waStatus.linked}
            onLink={() => alert('WhatsApp estará disponible pronto')}
            roundedButtons
          />
        </div>
      </div>
    </main>
  );
}