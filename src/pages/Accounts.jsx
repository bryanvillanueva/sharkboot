import React, { useState, useEffect } from 'react';
import AccountCard from '../utils/AccountCard';
import { FaFacebook, FaWhatsapp, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

const BACKEND = import.meta.env.VITE_API_URL ?? 'https://sharkboot-backend-production.up.railway.app';

export default function Accounts() {
  // Facebook state
  const [fbStatus, setFbStatus] = useState(null);
  const [fbLoading, setFbLoading] = useState(false);

  // WhatsApp state
  const [waStatus, setWaStatus] = useState(null);
  const [waLoading, setWaLoading] = useState(false);
  const [waSetupModal, setWaSetupModal] = useState(false);
  const [setupStep, setSetupStep] = useState('initial'); // initial, processing, success, fallback, error

  // WhatsApp setup state
  const [fallbackInfo, setFallbackInfo] = useState(null);
  const [businessAccounts, setBusinessAccounts] = useState([]);
  const [selectedWaba, setSelectedWaba] = useState(null);
  const [selectedNumber, setSelectedNumber] = useState(null);

  // Facebook logic (mantener el existente)
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

  // WhatsApp logic
  const checkWaStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setWaLoading(true);
    try {
      const response = await fetch(`${BACKEND}/whatsapp/numbers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setWaStatus(data);
    } catch (error) {
      console.error('Error verificando estado de WhatsApp:', error);
      setWaStatus(null);
    } finally {
      setWaLoading(false);
    }
  };

  useEffect(() => {
    checkFbStatus();
    checkWaStatus();
  }, []);

  // Función para iniciar setup de WhatsApp
  const linkWhatsApp = async () => {
    // Verificar que Facebook esté vinculado
    if (!fbStatus?.linked) {
      alert('Primero debes vincular tu cuenta de Facebook');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes estar logueado para configurar WhatsApp');
      return;
    }

    setWaSetupModal(true);
    setSetupStep('processing');
    setWaLoading(true);

    try {
      // Llamar al endpoint de setup
      const response = await fetch(`${BACKEND}/whatsapp/setup?frontend_url=${encodeURIComponent(window.location.origin)}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          // Límite de plan alcanzado
          alert(`Límite alcanzado: ${data.current}/${data.limit} números para el plan ${data.plan}`);
          setWaSetupModal(false);
          return;
        }
        throw new Error(data.details || data.error);
      }

      // Abrir ventana popup para Embedded Signup
      const popup = window.open(
        data.embed_signup_url,
        'whatsapp_setup',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Escuchar cuando se cierre la ventana popup
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Verificar el resultado del setup
          checkSetupResult();
        }
      }, 1000);

    } catch (error) {
      console.error('Error iniciando setup de WhatsApp:', error);
      setSetupStep('error');
      alert('Error iniciando configuración: ' + error.message);
    } finally {
      setWaLoading(false);
    }
  };

  // Verificar resultado del setup después del popup
  const checkSetupResult = () => {
    // Escuchar cambios en localStorage o URL changes
    const urlParams = new URLSearchParams(window.location.search);
    
    // Si estamos en la página de setup, manejar los parámetros
    if (window.location.pathname === '/whatsapp/setup') {
      handleSetupCallback(urlParams);
      return;
    }

    // Si no hay parámetros, asumir que se canceló
    setSetupStep('initial');
    setWaSetupModal(false);
  };

  // Manejar callback del setup
  const handleSetupCallback = (urlParams) => {
    const status = urlParams.get('status');
    
    if (status === 'success') {
      setSetupStep('success');
      // Cargar cuentas disponibles
      loadBusinessAccounts();
    } else if (status === 'fallback') {
      setSetupStep('fallback');
      // Mostrar información del fallback
      const fallbackData = {
        reason: urlParams.get('fallback_reason'),
        title: decodeURIComponent(urlParams.get('fallback_title') || ''),
        manualSetupUrl: urlParams.get('manual_setup_url'),
        instructions: JSON.parse(decodeURIComponent(urlParams.get('instructions') || '[]'))
      };
      setFallbackInfo(fallbackData);
    } else {
      setSetupStep('error');
    }

    // Limpiar URL
    window.history.replaceState({}, document.title, '/accounts');
  };

  // Cargar cuentas de WhatsApp Business disponibles
  const loadBusinessAccounts = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${BACKEND}/whatsapp/business-accounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setBusinessAccounts(data.whatsapp_accounts || []);
    } catch (error) {
      console.error('Error cargando cuentas de WhatsApp:', error);
    }
  };

  // Registrar número de WhatsApp seleccionado
  const registerSelectedNumber = async () => {
    if (!selectedWaba || !selectedNumber) {
      alert('Debes seleccionar una cuenta y número');
      return;
    }

    const token = localStorage.getItem('token');
    setWaLoading(true);

    try {
      const response = await fetch(`${BACKEND}/whatsapp/register-number`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          waba_id: selectedWaba.waba_id,
          phone_number_id: selectedNumber.id,
          display_name: selectedNumber.verified_name || selectedWaba.waba_name
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error);
      }

      alert('¡Número de WhatsApp registrado exitosamente!');
      setWaSetupModal(false);
      setSetupStep('initial');
      checkWaStatus(); // Refrescar estado

    } catch (error) {
      console.error('Error registrando número:', error);
      alert('Error registrando número: ' + error.message);
    } finally {
      setWaLoading(false);
    }
  };

  // Sincronizar después de configuración manual
  const syncAfterManualSetup = async () => {
    setWaLoading(true);
    try {
      await loadBusinessAccounts();
      if (businessAccounts.length > 0) {
        setSetupStep('success');
      } else {
        alert('No se encontraron números configurados. Completa la configuración manual primero.');
      }
    } catch (error) {
      console.error('Error sincronizando:', error);
      alert('Error sincronizando. Intenta nuevamente.');
    } finally {
      setWaLoading(false);
    }
  };

  // Facebook functions (mantener las existentes)
  const linkFacebook = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes estar logueado para vincular Facebook');
      return;
    }
    
    setFbLoading(true);
    const linkUrl = `${BACKEND}/auth/facebook/link?frontend_url=${encodeURIComponent(window.location.origin)}&token=${encodeURIComponent(token)}`;
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
        checkFbStatus();
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

  // Manejar errores de retorno en la URL
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
      window.history.replaceState({}, document.title, '/accounts');
    }
    
    const facebookLinked = urlParams.get('facebook_linked');
    if (facebookLinked === 'true') {
      alert('¡Facebook vinculado exitosamente!');
      window.history.replaceState({}, document.title, '/accounts');
      checkFbStatus();
    }

    // Manejar callback de WhatsApp setup
    if (window.location.pathname === '/accounts' && 
        (urlParams.get('status') === 'success' || urlParams.get('status') === 'fallback')) {
      setWaSetupModal(true);
      handleSetupCallback(urlParams);
    }
  }, []);

  // Renderizar modal de setup de WhatsApp
  const renderWhatsAppSetupModal = () => {
    if (!waSetupModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          {setupStep === 'processing' && (
            <div className="text-center">
              <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Configurando WhatsApp...</h3>
              <p className="text-gray-600">Se abrirá una ventana para vincular tu cuenta</p>
            </div>
          )}

          {setupStep === 'success' && (
            <div>
              <div className="text-center mb-4">
                <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-2" />
                <h3 className="text-lg font-bold">¡Configuración exitosa!</h3>
                <p className="text-gray-600">Selecciona el número de WhatsApp que quieres usar:</p>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {businessAccounts.map((account) => (
                  <div key={account.waba_id} className="border rounded p-3">
                    <h4 className="font-medium">{account.business_name}</h4>
                    <p className="text-sm text-gray-600">{account.waba_name}</p>
                    
                    {account.phone_numbers.map((number) => (
                      <div key={number.id} className="mt-2 p-2 border-l-2 border-green-500 bg-green-50">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="selected_number"
                            value={number.id}
                            onChange={() => {
                              setSelectedWaba(account);
                              setSelectedNumber(number);
                            }}
                            className="text-green-500"
                          />
                          <div>
                            <span className="font-medium">{number.display_phone_number}</span>
                            <p className="text-xs text-gray-600">{number.verified_name}</p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              number.code_verification_status === 'VERIFIED' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {number.code_verification_status}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="flex space-x-3 mt-4">
                <button
                  onClick={registerSelectedNumber}
                  disabled={!selectedNumber || waLoading}
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {waLoading ? 'Registrando...' : 'Registrar Número'}
                </button>
                <button
                  onClick={() => setWaSetupModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {setupStep === 'fallback' && fallbackInfo && (
            <div>
              <div className="text-center mb-4">
                <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-2" />
                <h3 className="text-lg font-bold">{fallbackInfo.title}</h3>
                <p className="text-gray-600">Se requiere configuración manual</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
                <h4 className="font-medium mb-2">Pasos a seguir:</h4>
                <ol className="text-sm space-y-1">
                  {fallbackInfo.instructions.map((instruction, index) => (
                    <li key={index} className="flex">
                      <span className="mr-2">{index + 1}.</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex space-x-3">
                <a
                  href={fallbackInfo.manualSetupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded text-center hover:bg-blue-600"
                >
                  Ir a configuración manual
                </a>
                <button
                  onClick={syncAfterManualSetup}
                  disabled={waLoading}
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {waLoading ? 'Sincronizando...' : 'Sincronizar'}
                </button>
              </div>
              
              <button
                onClick={() => setWaSetupModal(false)}
                className="w-full mt-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          )}

          {setupStep === 'error' && (
            <div className="text-center">
              <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-2" />
              <h3 className="text-lg font-bold mb-2">Error en la configuración</h3>
              <p className="text-gray-600 mb-4">Hubo un problema configurando WhatsApp</p>
              <button
                onClick={() => setWaSetupModal(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

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
            status={waStatus?.numbers?.length > 0 ? `${waStatus.numbers.length} número(s) configurado(s)` : 'No configurado'}
            details={waStatus?.numbers?.length > 0 ? [
              `Plan: ${waStatus.plan_info?.plan} (${waStatus.plan_info?.current}/${waStatus.plan_info?.limit})`,
              'Mensajería automática activa',
              'Gestión de contactos disponible'
            ] : [
              'Requiere Facebook vinculado',
              'Mensajería automática',
              'Gestión de contactos'
            ]}
            loading={waLoading}
            onLink={linkWhatsApp}
            linked={waStatus?.numbers?.length > 0}
            roundedButtons
          />
        </div>
      </div>
      
      {renderWhatsAppSetupModal()}
    </main>
  );
}