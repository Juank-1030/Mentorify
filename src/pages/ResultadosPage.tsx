import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, Award, BookOpen, Video, ChevronRight, Brain, TrendingUp } from 'lucide-react';

const ResultadosPage: React.FC = () => {
  const navigate = useNavigate();

  const resultados = {
    correcto: false,
    porcentaje: 0,
    totalPreguntas: 5,
    correctas: 0,
    preguntas: [
      { pregunta: '¿Dónde ocurre la fase luminosa de la fotosíntesis?', correcta: false, tuRespuesta: 'En el estroma del cloroplasto', respuestaCorrecta: 'En las membranas tilacoidales' },
      { pregunta: '¿Cuál es la enzima encargada de fijar el CO₂ en el Ciclo de Calvin?', correcta: false, tuRespuesta: 'ATP sintasa', respuestaCorrecta: 'RuBisCO' },
      { pregunta: '¿Qué productos se obtienen en la fase luminosa?', correcta: false, tuRespuesta: 'Glucosa y oxígeno', respuestaCorrecta: 'ATP, NADPH y oxígeno' },
      { pregunta: '¿Cuál es la ecuación general de la fotosíntesis?', correcta: false, tuRespuesta: 'CO₂ + H₂O → C₆H₁₂O₆', respuestaCorrecta: '6CO₂ + 6H₂O → C₆H₁₂O + 6O₂' },
      { pregunta: '¿Cuál es el rango óptimo de temperatura para la fotosíntesis?', correcta: false, tuRespuesta: '0-10°C', respuestaCorrecta: '20-30°C' }
    ]
  };

  const videosRecomendados = [
    {
      titulo: 'La Fase Luminosa explicada paso a paso',
      duracion: '12 min',
      descripcion: 'Video donde se explica detalladamente la cadena de transporte de electrones y la producción de ATP y NADPH en los tilacoides.',
      thumbnail: '🎬'
    },
    {
      titulo: 'Ciclo de Calvin - Animación 3D',
      duracion: '8 min',
      descripcion: 'Animación interactiva que muestra cómo la enzima RuBisCO fija el CO₂ y se produce glucosa.',
      thumbnail: ''
    },
    {
      titulo: 'Ecuación de la fotosíntesis - Desglose completo',
      duracion: '6 min',
      descripcion: 'Video que desglosa cada componente de la ecuación general y su significado biológico.',
      thumbnail: '🎬'
    }
  ];

  const getPuntuacionAutonomia = () => {
    // Calcula puntuación basada en pistas usadas y errores
    return 65; // Ejemplo
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Mentorify</span>
            </div>
            
            <button
              onClick={() => navigate('/chat')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Volver al chat
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resultados del Cuestionario */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-orange-600" />
            <span>Resultados del Cuestionario</span>
          </h2>
          
          <div className="flex items-center space-x-6 mb-6">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#E5E7EB"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#EF4444"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(resultados.porcentaje / 100) * 251.2} 251.2`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-red-600">{resultados.porcentaje}%</span>
              </div>
            </div>
            
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {resultados.correctas}/{resultados.totalPreguntas}
              </p>
              <p className="text-gray-600">respuestas correctas</p>
              <p className="text-red-600 font-medium mt-1">Necesitas reforzar este tema</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {resultados.preguntas.map((pregunta, index) => (
              <div key={index} className="bg-white rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">{pregunta.pregunta}</p>
                    <div className="text-sm">
                      <p className="text-red-600">
                        <span className="font-medium">Tu respuesta:</span> {pregunta.tuRespuesta}
                      </p>
                      <p className="text-green-600">
                        <span className="font-medium">Respuesta correcta:</span> {pregunta.respuestaCorrecta}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Puntuación de Autonomía */}
        <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Award className="w-6 h-6 text-yellow-500" />
            <span>Puntuación de Autonomía</span>
          </h2>
          
          <div className="flex items-center space-x-6">
            <div className="text-5xl font-bold text-blue-600">{getPuntuacionAutonomia()}</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all"
                  style={{ width: `${getPuntuacionAutonomia()}%` }}
                ></div>
              </div>
              <p className="text-gray-600 text-sm">
                Tu nivel de autonomía muestra que puedes resolver problemas con guía moderada.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">2</p>
              <p className="text-sm text-gray-600">Pistas usadas</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">3</p>
              <p className="text-sm text-gray-600">Intentos</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">15 min</p>
              <p className="text-sm text-gray-600">Tiempo total</p>
            </div>
          </div>
        </div>

        {/* Videos Recomendados */}
        <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Video className="w-6 h-6 text-red-500" />
              <span>Videos Recomendados</span>
            </h2>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1">
              <span>Ver todos</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">Basados en tus áreas de mejora</p>
          
          <div className="space-y-4">
            {videosRecomendados.map((video, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="text-4xl">{video.thumbnail}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{video.titulo}</h3>
                  <p className="text-sm text-gray-600 mb-2">{video.descripcion}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">{video.duracion}</span>
                    <span className="text-blue-600 text-sm font-medium">Ver recurso →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen del Tema */}
        <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <span>Resumen del Tema</span>
          </h2>
          
          <div className="prose prose-sm max-w-none text-gray-600">
            <p>
              La <strong>fotosíntesis</strong> es el proceso mediante el cual las plantas convierten la energía lumínica 
              en energía química. Consta de dos fases principales:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Fase luminosa:</strong> Ocurre en las membranas tilacoidales. La luz solar excita los electrones 
              de la clorofila, produciendo ATP y NADPH.</li>
              <li><strong>Ciclo de Calvin (fase oscura):</strong> Ocurre en el estroma. Utiliza el ATP y NADPH para fijar 
              CO₂ y producir glucosa.</li>
            </ul>
            <p className="mt-4">
              La ecuación general es: <strong>6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂</strong>
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/chat')}
            className="flex-1 bg-gray-900 text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
          >
            <span>Siguiente ejercicio</span>
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/progreso')}
            className="flex-1 bg-white text-gray-900 px-8 py-4 rounded-full font-medium border border-gray-200 hover:border-gray-300 transition-colors"
          >
            Ver mi progreso
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultadosPage;
