// src/utils/userCache.js
// Utilidad para gestionar caché específico por usuario con debugging mejorado

/**
 * Obtiene el ID del usuario actual desde el token JWT
 */
const getCurrentUserId = () => {
  const token = localStorage.getItem('token');
  console.log('🔍 getCurrentUserId - Token presente:', !!token);
  
  if (!token) {
    console.warn('⚠️ getCurrentUserId - No hay token en localStorage');
    return null;
  }
  
  try {
    // Verificar que el token tenga la estructura correcta (3 partes separadas por puntos)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ getCurrentUserId - Token malformado, partes:', parts.length);
      return null;
    }

    // Decodificar JWT para obtener user ID
    const payload = JSON.parse(atob(parts[1]));
    console.log('📋 getCurrentUserId - Payload decodificado:', payload);
    
    // Buscar el user ID en diferentes campos posibles
    const userId = payload.user_id || payload.sub || payload.id || payload.userId;
    console.log('👤 getCurrentUserId - User ID encontrado:', userId);
    
    if (!userId) {
      console.error('❌ getCurrentUserId - No se encontró user ID en payload:', Object.keys(payload));
    }
    
    return userId;
  } catch (error) {
    console.error('❌ getCurrentUserId - Error decodificando token:', error);
    console.log('🔍 Token problemático:', token.substring(0, 50) + '...');
    return null;
  }
};

/**
 * Genera una clave específica para el usuario actual
 */
const getUserSpecificKey = (key) => {
  const userId = getCurrentUserId();
  const userKey = userId ? `${key}_user_${userId}` : key;
  console.log(`🔑 getUserSpecificKey - ${key} -> ${userKey}`);
  return userKey;
};

/**
 * Guarda datos específicos del usuario en localStorage
 */
export const setUserData = (key, data) => {
  try {
    const userKey = getUserSpecificKey(key);
    const jsonData = JSON.stringify(data);
    localStorage.setItem(userKey, jsonData);
    console.log(`💾 setUserData - Guardado ${key}:`, data?.length || 'N/A', 'items en', userKey);
  } catch (error) {
    console.error(`❌ setUserData - Error guardando ${key}:`, error);
  }
};

/**
 * Obtiene datos específicos del usuario desde localStorage
 */
export const getUserData = (key, defaultValue = null) => {
  try {
    const userKey = getUserSpecificKey(key);
    const stored = localStorage.getItem(userKey);
    
    console.log(`📖 getUserData - Buscando ${key} en ${userKey}:`, !!stored);
    
    if (!stored) {
      console.log(`📖 getUserData - No encontrado, retornando default:`, defaultValue);
      return defaultValue;
    }
    
    const parsed = JSON.parse(stored);
    console.log(`✅ getUserData - ${key} encontrado:`, parsed?.length || 'N/A', 'items');
    return parsed;
  } catch (error) {
    console.error(`❌ getUserData - Error parseando ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Elimina datos específicos del usuario
 */
export const removeUserData = (key) => {
  const userKey = getUserSpecificKey(key);
  localStorage.removeItem(userKey);
  console.log(`🗑️ removeUserData - Eliminado ${userKey}`);
};

/**
 * Limpia TODOS los datos del usuario actual
 */
export const clearUserData = () => {
  const userId = getCurrentUserId();
  console.log('🧹 clearUserData - Limpiando datos del usuario:', userId);
  
  if (!userId) {
    console.warn('⚠️ clearUserData - No hay userId, limpieza básica');
    return;
  }
  
  // Lista de claves que contienen datos del usuario
  const userKeys = [
    'assistants',
    'userData', 
    'facebookToken',
    'isAuthenticated',
    'authMethod',
    'pendingUserData',
    'facebookLinked'
  ];
  
  // Limpiar datos específicos del usuario
  let cleanedCount = 0;
  userKeys.forEach(key => {
    const userKey = getUserSpecificKey(key);
    if (localStorage.getItem(userKey)) {
      localStorage.removeItem(userKey);
      cleanedCount++;
      console.log(`🗑️ clearUserData - Eliminado ${userKey}`);
    }
  });
  
  // Limpiar también las claves sin prefijo de usuario (legacy)
  userKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      cleanedCount++;
      console.log(`🗑️ clearUserData - Eliminado legacy ${key}`);
    }
  });
  
  console.log(`✅ clearUserData - ${cleanedCount} claves eliminadas`);
};

/**
 * Limpia COMPLETAMENTE el localStorage (para logout)
 */
export const clearAllData = () => {
  console.log('🧹 clearAllData - Iniciando limpieza completa');
  
  // Limpiar tokens
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  console.log('🗑️ clearAllData - Tokens eliminados');
  
  // Limpiar datos del usuario actual
  clearUserData();
  
  console.log('✅ clearAllData - Limpieza completa finalizada');
};

/**
 * Migra datos existentes al formato específico por usuario
 */
export const migrateToUserSpecific = () => {
  const userId = getCurrentUserId();
  console.log('📦 migrateToUserSpecific - Iniciando migración para usuario:', userId);
  
  if (!userId) {
    console.warn('⚠️ migrateToUserSpecific - No hay userId, saltando migración');
    return;
  }
  
  const keysToMigrate = ['assistants', 'userData'];
  let migratedCount = 0;
  
  keysToMigrate.forEach(key => {
    const oldData = localStorage.getItem(key);
    if (oldData) {
      const userKey = getUserSpecificKey(key);
      // Solo migrar si no existe ya la clave específica
      if (!localStorage.getItem(userKey)) {
        localStorage.setItem(userKey, oldData);
        console.log(`📦 migrateToUserSpecific - Migrado ${key} a ${userKey}`);
        migratedCount++;
      } else {
        console.log(`📦 migrateToUserSpecific - ${userKey} ya existe, no migrando`);
      }
      // Remover clave antigua
      localStorage.removeItem(key);
      console.log(`🗑️ migrateToUserSpecific - Removido legacy ${key}`);
    }
  });
  
  console.log(`✅ migrateToUserSpecific - ${migratedCount} claves migradas`);
};

// Funciones específicas para asistentes
export const setAssistants = (assistants) => {
  console.log('📝 setAssistants - Guardando asistentes:', assistants?.length || 0);
  setUserData('assistants', assistants);
};

export const getAssistants = () => {
  const assistants = getUserData('assistants', []);
  console.log('📖 getAssistants - Obtenidos:', assistants?.length || 0, 'asistentes');
  return assistants;
};

export const clearAssistants = () => {
  console.log('🗑️ clearAssistants - Limpiando asistentes');
  removeUserData('assistants');
};

// Funciones para verificar si hay datos de usuario válidos
export const hasValidUserSession = () => {
  const token = localStorage.getItem('token');
  const userId = getCurrentUserId();
  const isValid = !!(token && userId);
  console.log('🔐 hasValidUserSession - Sesión válida:', isValid, '(token:', !!token, ', userId:', !!userId, ')');
  return isValid;
};

// Función de debugging para inspeccionar localStorage
export const debugLocalStorage = () => {
  console.log('\n🔍 === DEBUG LOCALSTORAGE ===');
  const keys = Object.keys(localStorage);
  console.log('📦 Total claves en localStorage:', keys.length);
  
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    if (key.includes('assistant') || key.includes('user') || key === 'token') {
      console.log(`🔑 ${key}:`, value?.substring(0, 100) + (value?.length > 100 ? '...' : ''));
    }
  });
  
  console.log('👤 User ID actual:', getCurrentUserId());
  console.log('📋 Asistentes en caché:', getAssistants()?.length || 0);
  console.log('=== FIN DEBUG ===\n');
};

export default {
  setUserData,
  getUserData,
  removeUserData,
  clearUserData,
  clearAllData,
  migrateToUserSpecific,
  setAssistants,
  getAssistants,
  clearAssistants,
  hasValidUserSession,
  getCurrentUserId,
  debugLocalStorage
};