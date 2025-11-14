// src/components/LocationsManager.tsx

import React, { useState } from 'react';
import { useLocations } from '../services/useLocations'; // <-- Importa o hook

// Um ícone simples para o lixo (você já tem seu arquivo icons.tsx)
const TrashIcon = () => (
  <svg /* ... */ fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 6h6v10H7V6z"
      clipRule="evenodd"
    />
  </svg>
);

export const LocationsManager: React.FC = () => {
  const { locations, loading, addLocation, deleteLocation } = useLocations();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4287f5'); // Cor padrão

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') return;
    addLocation(name, color);
    setName('');
    setColor('#4287f5');
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4">Gerenciar Locais</h2>

      {/* --- Formulário de Adição --- */}
      <form onSubmit={handleSubmit} className="flex gap-4 mb-6 items-end">
        <div>
          <label htmlFor="locationName" className="block text-sm font-medium text-slate-300">
            Nome do Local
          </label>
          <input
            id="locationName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Hospital Central"
            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="locationColor" className="block text-sm font-medium text-slate-300">
            Cor
          </label>
          <input
            id="locationColor"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="mt-1 w-20 h-10 p-1 bg-slate-700 border border-slate-600 rounded-md cursor-pointer"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
        >
          Adicionar
        </button>
      </form>

      {/* --- Lista de Locais --- */}
      <div className="space-y-3">
        {loading && <p className="text-slate-400">Carregando locais...</p>}
        {!loading && locations.length === 0 && (
          <p className="text-slate-400">Nenhum local cadastrado ainda.</p>
        )}
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="flex items-center justify-between bg-slate-700 p-3 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full border-2 border-slate-400"
                style={{ backgroundColor: loc.color }}
              />
              <span className="text-white font-medium">{loc.name}</span>
            </div>
            <button
              onClick={() => deleteLocation(loc.id)}
              className="text-slate-400 hover:text-red-500"
            >
              <TrashIcon />
            </button>
            {/* Nota: O botão de Update foi omitido por simplicidade do MVP, 
                mas pode ser adicionado facilmente. */}
          </div>
        ))}
      </div>
    </div>
  );
};