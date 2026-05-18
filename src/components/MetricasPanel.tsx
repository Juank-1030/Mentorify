import React from 'react';
import { TrendingUp, Clock, Target } from 'lucide-react';

interface MetricasPanelProps {
  pistasEntregadas: number;
  erroresConsecutivos: number;
  maxPistas?: number;
}

const MetricasPanel: React.FC<MetricasPanelProps> = ({
  pistasEntregadas,
  erroresConsecutivos,
  maxPistas = 3
}) => {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <TrendingUp className="w-4 h-4 text-green-500" />
        <span>Progreso de la sesión</span>
      </h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Pistas usadas</span>
            <span className="font-medium text-gray-900">{pistasEntregadas}/{maxPistas}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(pistasEntregadas / maxPistas) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Errores consecutivos</span>
          <span className={`font-medium ${erroresConsecutivos > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {erroresConsecutivos}
          </span>
        </div>
        
        <div className="pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Tiempo</p>
              <p className="text-sm font-bold text-gray-900">12 min</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <Target className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Precisión</p>
              <p className="text-sm font-bold text-gray-900">75%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricasPanel;
