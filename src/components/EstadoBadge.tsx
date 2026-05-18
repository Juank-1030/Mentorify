import React from 'react';

interface EstadoBadgeProps {
  estado: string;
}

const EstadoBadge: React.FC<EstadoBadgeProps> = ({ estado }) => {
  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      'INICIO_SESION': 'bg-blue-100 text-blue-700',
      'EXPLORACION_CONCEPTUAL': 'bg-blue-100 text-blue-700',
      'INTENTO_INICIAL': 'bg-yellow-100 text-yellow-700',
      'AVANCE_PARCIAL': 'bg-green-100 text-green-700',
      'ERROR_UNICO': 'bg-orange-100 text-orange-700',
      'ESTANCAMIENTO': 'bg-red-100 text-red-700',
      'PISTA_AUXILIO': 'bg-purple-100 text-purple-700',
      'COMPLETADO': 'bg-green-100 text-green-700'
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(estado)}`}>
      {estado.replace('_', ' ')}
    </span>
  );
};

export default EstadoBadge;
