// src/pages/Login.jsx – versión final sin debug
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

const BACKEND = import.meta.env.VITE_API_URL ?? 'https://sharkboot-backend-production.up.railway.app';
const FRONTEND_URL = window.location.origin;

async function loginEmail({ email, password }) {
  const res = await fetch(`${BACKEND}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Error al iniciar sesión');
  return res.json();
}

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Token JWT estándar
    const token = urlParams.get('token');
    const authToken = urlParams.get('auth_token');
    
    // Parámetros de Facebook
    const fbToken = urlParams.get('fb_token');
    const fbId = urlParams.get('fb_id');
    const userName = urlParams.get('name');
    const userEmail = urlParams.get('email');
    const fbError = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    // Detectar estado especial
    const isNewUser = urlParams.get('new_user') === 'true';
    const isLinked = urlParams.get('linked') === 'facebook';

    // Manejar errores de Facebook
    if (fbError) {
      setFacebookLoading(false);
      let errorMessage = 'Error al iniciar sesión con Facebook';
      
      switch (fbError) {
        case 'access_denied':
          errorMessage = 'Acceso denegado. Necesitas aprobar los permisos para continuar.';
          break;
        case 'invalid_state':
          errorMessage = 'Sesión expirada. Por favor, intenta nuevamente.';
          break;
        case 'callback_error':
          errorMessage = 'Error procesando la autenticación. Intenta nuevamente.';
          break;
        case 'facebook_not_configured':
          errorMessage = 'Facebook no está configurado correctamente.';
          break;
        default:
          errorMessage = errorDescription || 'Error desconocido al autenticar con Facebook';
      }
      
      setError(errorMessage);
      window.history.replaceState({}, document.title, '/login');
      return;
    }

    // Manejar vinculación exitosa (usuario ya tenía cuenta)
    if (isLinked && authToken) {
      localStorage.setItem('token', authToken);
      localStorage.setItem('facebookLinked', 'true');
      window.history.replaceState({}, document.title, '/login');
      setError('');
      
      setTimeout(() => {
        navigate('/dashboard?facebook_linked=true');
      }, 1000);
      return;
    }

    // Manejar login exitoso - Prioridad: JWT token > auth_token
    if (token) {
      localStorage.setItem('token', token);
      navigate('/');
      return;
    }
    
    if (authToken) {
      localStorage.setItem('token', authToken);
      
      // Verificar si es usuario nuevo para redirigir al onboarding
      if (isNewUser) {
        // Guardar datos adicionales para el onboarding
        localStorage.setItem('facebookToken', fbToken);
        localStorage.setItem('pendingUserData', JSON.stringify({
          facebook_id: fbId,
          name: userName,
          email: userEmail,
          source: 'facebook',
          needs_onboarding: true
        }));
        
        window.history.replaceState({}, document.title, '/login');
        navigate('/complete-profile');
      } else {
        navigate('/');
      }
      return;
    }
    
    // Manejo manual de Facebook sin JWT
    if (fbToken && fbId) {
      // Guardar datos de Facebook
      localStorage.setItem('facebookToken', fbToken);
      localStorage.setItem('userData', JSON.stringify({
        id: fbId,
        facebook_id: fbId,
        firstname: userName ? userName.split(' ')[0] : 'Usuario',
        lastname: userName ? userName.split(' ').slice(1).join(' ') : 'Facebook',
        name: userName || 'Usuario Facebook',
        email: userEmail || '',
        role: 'Usuario',
        access_token: fbToken,
        auth_method: 'facebook',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('authMethod', 'facebook');
      window.history.replaceState({}, document.title, '/login');
      
      if (isNewUser) {
        navigate('/complete-profile');
      } else {
        navigate('/');
      }
      return;
    }
    
  }, [navigate]);

  const { mutate, isPending, error: mutationError } = useMutation({
    mutationFn: loginEmail,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      navigate('/');
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    mutate({ email, password });
  };

  const handleFacebook = () => {
    setFacebookLoading(true);
    setError('');
    
    const authUrl = `${BACKEND}/auth/facebook/start?frontend_url=${encodeURIComponent(FRONTEND_URL)}`;
    window.location.href = authUrl;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const displayError = error || mutationError?.message;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Iniciar sesión</h1>
          <p className="text-gray-600">Accede a tu cuenta SharkBoot</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="tu@email.com"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                placeholder="••••••••"
              />
            </div>

            {/* Error message */}
            {displayError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{displayError}</span>
                </div>
              </div>
            )}

            {/* Botón de login */}
            <button
              type="submit"
              disabled={isLoading || isPending}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {(isLoading || isPending) ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">o</span>
            </div>
          </div>

          {/* Botón de Facebook */}
          <button
            type="button"
            onClick={handleFacebook}
            disabled={facebookLoading}
            className="w-full bg-blue-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-900 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {facebookLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Conectando con Facebook...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                </svg>
                Continuar con Facebook
              </>
            )}
          </button>

          {/* Enlaces adicionales */}
          <div className="mt-6 text-center space-y-2">
            <a 
              href="#" 
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 block"
            >
              ¿Olvidaste tu contraseña?
            </a>
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          © 2025 SharkBoot
        </div>
      </div>
    </div>
  );
};

export default Login;