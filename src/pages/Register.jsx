import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_API_URL ?? 'https://sharkboot-backend-production.up.railway.app';

async function registerUser(payload) {
  const res = await fetch(`${BACKEND}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error al registrar');
  const { token } = await res.json();
  localStorage.setItem('token', token);
}

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    phone: '',
    dob: '',
    country: '',
    city: '',
    role: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await registerUser(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Crear cuenta</h1>
          <p className="text-gray-600">Regístrate en SharkBoot</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Nombre completo *" />
            <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Email *" />
            <input name="password" type="password" value={form.password} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Contraseña *" />
            <input name="company" value={form.company} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Empresa *" />
            <input name="phone" value={form.phone} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Teléfono" />
            <input name="dob" type="date" value={form.dob} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Fecha de nacimiento" />
            <input name="country" value={form.country} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="País" />
            <input name="city" value={form.city} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ciudad" />
            <input name="role" value={form.role} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Rol" />
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              {isLoading ? 'Registrando...' : 'Crear cuenta'}
            </button>
            <button type="button" onClick={() => navigate('/login')} className="w-full mt-2 text-blue-600 hover:text-blue-800 font-medium">¿Ya tienes cuenta? Inicia sesión</button>
          </form>
        </div>
        <div className="text-center mt-8 text-sm text-gray-500">© 2025 SharkBoot</div>
      </div>
    </div>
  );
};

export default Register; 