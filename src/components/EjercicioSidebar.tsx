import React from 'react';
import { X } from 'lucide-react';

interface Ejercicio {
  id: number;
  titulo: string;
  dominio: string;
  nivel_dificultad: string;
}

interface EjercicioSidebarProps {
  ejercicios: Ejercicio[];
  selectedEjercicio: Ejercicio | null;
  onSelectEjercicio: (ejercicio: Ejercicio) => void;
  onClose: () => void;
  isOpen: boolean;
}

const EjercicioSidebar: React.FC<EjercicioSidebarProps> = ({
  ejercicios,
  selectedEjercicio,
  onSelectEjercicio,
  onClose,
  isOpen
}) => {
  const groupedEjercicios = ejercicios.reduce((acc, ejercicio) => {
    if (!acc[ejercicio.dominio]) {
      acc[ejercicio.dominio] = [];
    }
    acc[ejercicio.dominio].push(ejercicio);
    return acc;
  }, {} as Record<string, Ejercicio[]>);

  const getNivelColor = (nivel: string) => {
    const colors: Record<string, string> = {
      'basico': 'bg-green-100 text-green-700',
      'medio': 'bg-yellow-100 text-yellow-700',
      'avanzado': 'bg-red-100 text-red-700'
    };
    return colors[nivel] || 'bg-gray-100 text-gray-700';
  };

  if (!isOpen) return null;

  return (
    <div className="w-72 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <h2 className="font-bold text-gray-900">Ejercicios</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(groupedEjercicios).map(([dominio, ejercicios]) => (
          <div key={dominio}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {dominio}
            </h3>
            <div className="space-y-1">
              {ejercicios.map(ejercicio => (
                <button
                  key={ejercicio.id}
                  onClick={() => onSelectEjercicio(ejercicio)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedEjercicio?.id === ejercicio.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="font-medium truncate">{ejercicio.titulo}</div>
                  <div className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${getNivelColor(ejercicio.nivel_dificultad)}`}>
                    {ejercicio.nivel_dificultad}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EjercicioSidebar;
