// src/config/config.js - Configuración de URLs según el entorno

// Configuración de URLs según el entorno
const config = {
    development: {
      frontendUrl: 'http://localhost:5173',
      backendUrl: 'https://sharkboot-backend-production.up.railway.app',
      redirectUrl: 'http://localhost:5173/login'
    },
    production: {
      frontendUrl: 'https://boot.sharkagency.co',
      backendUrl: 'https://sharkboot-backend-production.up.railway.app',
      redirectUrl: 'https://boot.sharkagency.co/login'
    }
  };
  
  // Determinar el entorno - Detección mejorada
  const isDevelopment = 
    import.meta.env.MODE === 'development' || 
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.port === '5173' ||
    window.location.port === '3000' ||
    window.location.hostname.includes('localhost');
  
  // Logs para debug (útil para verificar la detección)
  console.log('🔍 Config.js - Detección de entorno:');
  console.log('📍 MODE:', import.meta.env.MODE);
  console.log('📍 hostname:', window.location.hostname);
  console.log('📍 port:', window.location.port);
  console.log('📍 isDevelopment:', isDevelopment);
  
  // Exportar las URLs según el entorno detectado
  export const FRONTEND_URL = isDevelopment ? config.development.frontendUrl : config.production.frontendUrl;
  export const BACKEND_URL = isDevelopment ? config.development.backendUrl : config.production.backendUrl;
  export const REDIRECT_URL = isDevelopment ? config.development.redirectUrl : config.production.redirectUrl;
  
  // Log final para verificar exportación
  console.log('✅ Config.js - URLs exportadas:');
  console.log('📍 FRONTEND_URL:', FRONTEND_URL);
  console.log('📍 BACKEND_URL:', BACKEND_URL);
  console.log('📍 REDIRECT_URL:', REDIRECT_URL);
  
  export default config;