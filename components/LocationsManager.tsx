import React, { useState } from 'react';
import { TrashIcon, PlusIcon, MapPinIcon } from './Icons';

interface LocationsManagerProps {
  locations: any[]; 
  addLocation: (name: string, color: string) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
}

const LocationsManager: React.FC<LocationsManagerProps> = ({ 
  locations = [], 
  addLocation, 
  deleteLocation 
}) => {
  const [newLocation, setNewLocation] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.trim()) return;

    setIsSubmitting(true);
    try {
      await addLocation(newLocation, newColor);
      setNewLocation('');
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar local.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
      <div className="flex items-center gap-2 mb-4 text-slate-100">
        <MapPinIcon className="w-6 h-6 text-indigo-400" />
        <h2 className="text-xl font-bold">Gerenciar Locais</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end mb-6">
        <div className="w-full sm:flex-1 space-y-1">
          <label className="text-xs text-slate-400 font-bold uppercase">Nome do Local</label>
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            placeholder="Ex: Hospital Central"
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-bold uppercase">Cor</label>
          <div className="flex items-center bg-slate-900 border border-slate-600 rounded-md px-1 h-[42px]">
             <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-8 w-12 bg-transparent cursor-pointer border-none outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !newLocation}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 h-[42px]"
        >
          {isSubmitting ? '...' : <><PlusIcon className="w-5 h-5" /> Adicionar</>}
        </button>
      </form>

      <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
        {locations.length === 0 ? (
          <p className="text-slate-500 text-sm italic py-2">Nenhum local cadastrado.</p>
        ) : (
          locations.map((loc) => (
            <div 
              key={loc.id} 
              className="flex items-center justify-between p-3 bg-slate-750 border border-slate-700 rounded hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span 
                  className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
                  style={{ backgroundColor: loc.color }}
                />
                <span className="text-slate-200">{loc.name}</span>
              </div>
              <button
                onClick={() => { if(window.confirm('Excluir este local?')) deleteLocation(loc.id); }}
                className="text-slate-500 hover:text-red-400 p-1"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ESTA LINHA ABAIXO É O QUE FALTAVA PARA CORRIGIR O ERRO DA TELA BRANCA
export default LocationsManager;