import React from 'react';

export default function AccountCard({ icon, name, color, status, details = [], loading, onLink, onUnlink, onView, linked, roundedButtons }) {
  return (
    <div className="relative bg-white rounded-2xl shadow-md p-6 flex flex-col items-center border border-gray-100" style={{ borderTop: `4px solid ${color}` }}>
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow p-2" style={{ border: `2px solid ${color}` }}>
        {icon}
      </div>
      <div className="mt-8 mb-2 text-lg font-bold text-gray-800 text-center">{name}</div>
      <div className={`mb-2 px-3 py-1 rounded-full text-xs font-semibold ${linked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{status}</div>
      <ul className="text-xs text-gray-600 mb-4 space-y-1 w-full">
        {details.map((d, i) => <li key={i}>{d}</li>)}
      </ul>
      <div className="w-full space-y-2">
        {linked ? (
          <>
            {onView && (
              <button
                onClick={onView}
                className={`w-full text-white py-2 ${roundedButtons ? 'rounded-full' : 'rounded-lg'} hover:opacity-90 transition disabled:opacity-50`}
                style={{ backgroundColor: color }}
                disabled={loading}
              >
                Ver cuenta
              </button>
            )}
            <button
              onClick={onUnlink}
              className={`w-full bg-red-500 text-white py-2 ${roundedButtons ? 'rounded-full' : 'rounded-lg'} hover:bg-red-600 transition disabled:opacity-50`}
              disabled={loading}
            >
              {loading ? 'Desvinculando...' : 'Desvincular'}
            </button>
          </>
        ) : (
          <button
            onClick={onLink}
            className={`w-full bg-blue-600 text-white py-2 ${roundedButtons ? 'rounded-full' : 'rounded-lg'} hover:bg-blue-700 transition disabled:opacity-50`}
            disabled={loading}
          >
            {loading ? 'Redirigiendo...' : 'Vincular'}
          </button>
        )}
      </div>
    </div>
  );
} 