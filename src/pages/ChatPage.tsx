import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Lightbulb, TrendingUp, ChevronRight, ChevronLeft, X, Brain, AlertCircle } from 'lucide-react';
import { iniciarSesion, interactuar, obtenerEjercicios, Ejercicio as EjercicioType, InteraccionResponse } from '../services/api';

interface Mensaje {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatPage: React.FC = () => {
  const { ejercicioId } = useParams<{ ejercicioId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [messages, setMessages] = useState<Mensaje[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEjercicio, setSelectedEjercicio] = useState<EjercicioType | null>(null);
  const [ejercicios, setEjercicios] = useState<EjercicioType[]>([]);
  const [sesionId, setSesionId] = useState<number | null>(null);
  const [pistasEntregadas, setPistasEntregadas] = useState(0);
  const [erroresConsecutivos, setErroresConsecutivos] = useState(0);
  const [estadoEstudiante, setEstadoEstudiante] = useState('INICIO_SESION');
  const [error, setError] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cargar ejercicios al montar
  useEffect(() => {
    cargarEjercicios();
  }, []);

  // Iniciar sesión cuando el usuario elige un ejercicio distinto desde la URL
  useEffect(() => {
    if (ejercicioId && ejercicios.length > 0) {
      const ejercicio = ejercicios.find(e => e.id === parseInt(ejercicioId));
      if (ejercicio && ejercicio.id !== selectedEjercicio?.id) {
        setSelectedEjercicio(ejercicio);
        iniciarSesionConEjercicio(ejercicio);
      }
    }
  }, [ejercicioId]);

  const cargarEjercicios = async () => {
    try {
      const lista = await obtenerEjercicios();
      setEjercicios(lista);

      if (lista.length > 0) {
        // Si hay ejercicioId en la URL úsalo, si no auto-selecciona el primero
        const ejercicio = ejercicioId
          ? lista.find(e => e.id === parseInt(ejercicioId)) ?? lista[0]
          : lista[0];
        setSelectedEjercicio(ejercicio);
        iniciarSesionConEjercicio(ejercicio);
      }
    } catch (err) {
      console.error('Error al cargar ejercicios:', err);
      setError('No se pudo conectar con el servidor. Asegúrate de que el backend esté corriendo en http://localhost:8000');
      setEjercicios(ejerciciosRespaldo);
      // Auto-seleccionar primer ejercicio de respaldo
      setSelectedEjercicio(ejerciciosRespaldo[0]);
      iniciarSesionConEjercicio(ejerciciosRespaldo[0]);
    }
  };

  const iniciarSesionConEjercicio = async (ejercicio: EjercicioType) => {
    try {
      setError(null);
      const estudianteId = `student_${Date.now()}`;
      const response = await iniciarSesion(ejercicio.id, estudianteId);
      
      setSesionId(response.sesion_id);
      
      const welcomeMessage: Mensaje = {
        id: 'welcome',
        role: 'assistant',
        content: response.mensaje_bienvenida,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      setPistasEntregadas(0);
      setErroresConsecutivos(0);
      setEstadoEstudiante('INICIO_SESION');
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError('No se pudo iniciar la sesión. Verifica que el backend esté corriendo.');
      
      // Mensaje de respaldo
      const welcomeMessage: Mensaje = {
        id: 'welcome',
        role: 'assistant',
        content: `¡Hola! Soy Mentorify, tu mentor académico. 🎓\n\nHoy trabajaremos en: **${ejercicio.titulo}**\n\n${ejercicio.enunciado}\n\nEstoy aquí para guiarte con preguntas, no para darte respuestas. ¡Comencemos! ¿Qué piensas sobre este ejercicio?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || sesionId === null) return;

    const userMessage: Mensaje = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const textoAEnviar = inputValue;
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response: InteraccionResponse = await interactuar(sesionId, textoAEnviar);
      
      const assistantMessage: Mensaje = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.respuesta,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setPistasEntregadas(response.pistas_entregadas);
      setErroresConsecutivos(response.errores_consecutivos);
      setEstadoEstudiante(response.estado_estudiante);
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      setError('No se pudo obtener respuesta del servidor. Usando modo offline.');
      
      // Respuesta de respaldo (mock)
      const respuestasRespaldo = [
        "🤔 Interesante planteamiento. Antes de continuar, piensa: ¿qué conceptos clave del ejercicio podrías aplicar aquí?",
        "💡 Buen intento. Analicemos juntos: ¿qué pasaría si cambiaras ese enfoque? ¿Qué ventajas o desventajas ves?",
        "🎓 Estás en el camino correcto. Considera esto: ¿cuál sería el caso más simple de este problema?",
        " Observa detenidamente el enunciado. ¿Hay alguna pista sobre qué estrategia sería más eficiente?",
      ];
      
      const assistantMessage: Mensaje = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: respuestasRespaldo[Math.floor(Math.random() * respuestasRespaldo.length)],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setPistasEntregadas(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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

  const getNivelColor = (nivel: string) => {
    const colors: Record<string, string> = {
      'basico': 'bg-green-100 text-green-700',
      'medio': 'bg-yellow-100 text-yellow-700',
      'avanzado': 'bg-red-100 text-red-700'
    };
    return colors[nivel] || 'bg-gray-100 text-gray-700';
  };

  // Ejercicios de respaldo por si el backend no está disponible
  const ejerciciosRespaldo: EjercicioType[] = [
    { id: 1, titulo: 'Búsqueda Binaria en Python', enunciado: 'Implementa una función de búsqueda binaria.', dominio: 'algoritmos', nivel_dificultad: 'medio', conceptos_clave: ['búsqueda binaria', 'O(log n)'] },
    { id: 2, titulo: 'Complejidad Bubble Sort', enunciado: 'Analiza por qué Bubble Sort es O(n²).', dominio: 'algoritmos', nivel_dificultad: 'basico', conceptos_clave: ['complejidad', 'Big-O'] },
    { id: 3, titulo: 'Lista Enlazada vs Arreglo', enunciado: 'Compara estas estructuras de datos.', dominio: 'estructuras de datos', nivel_dificultad: 'basico', conceptos_clave: ['listas', 'arreglos'] },
    { id: 4, titulo: 'Recursión: Factorial', enunciado: 'Implementa factorial recursivo.', dominio: 'algoritmos', nivel_dificultad: 'basico', conceptos_clave: ['recursión', 'caso base'] },
    { id: 5, titulo: 'BST: Inserción', enunciado: 'Implementa inserción en BST.', dominio: 'estructuras de datos', nivel_dificultad: 'medio', conceptos_clave: ['árboles', 'BST'] },
    { id: 6, titulo: 'Herencia y Polimorfismo', enunciado: 'Crea jerarquía de clases.', dominio: 'POO', nivel_dificultad: 'medio', conceptos_clave: ['herencia', 'polimorfismo'] },
    { id: 7, titulo: 'Tabla Hash: Colisiones', enunciado: 'Explica manejo de colisiones.', dominio: 'estructuras de datos', nivel_dificultad: 'avanzado', conceptos_clave: ['hash', 'colisiones'] },
    { id: 8, titulo: 'Merge Sort', enunciado: 'Implementa Merge Sort.', dominio: 'algoritmos', nivel_dificultad: 'medio', conceptos_clave: ['merge sort', 'divide y vencerás'] },
    { id: 9, titulo: 'Big-O: Loops Anidados', enunciado: 'Determina complejidad de bucles.', dominio: 'algoritmos', nivel_dificultad: 'basico', conceptos_clave: ['Big-O', 'análisis'] },
    { id: 10, titulo: 'BFS vs DFS', enunciado: 'Compara BFS y DFS en grafos.', dominio: 'estructuras de datos', nivel_dificultad: 'avanzado', conceptos_clave: ['grafos', 'BFS', 'DFS'] }
  ];

  const ejerciciosAMostrar = ejercicios.length > 0 ? ejercicios : ejerciciosRespaldo;

  const groupedEjercicios = ejerciciosAMostrar.reduce((acc, ejercicio) => {
    if (!acc[ejercicio.dominio]) {
      acc[ejercicio.dominio] = [];
    }
    acc[ejercicio.dominio].push(ejercicio);
    return acc;
  }, {} as Record<string, EjercicioType[]>);

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar izquierdo - Lista de ejercicios */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex-shrink-0`}>
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Ejercicios</h2>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {Object.entries(groupedEjercicios).map(([dominio, ejercicios]) => (
              <div key={dominio}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {dominio}
                </h3>
                <div className="space-y-1">
                  {ejercicios.map(ejercicio => (
                    <button
                      key={ejercicio.id}
                      onClick={() => {
                        setSelectedEjercicio(ejercicio);
                        navigate(`/chat/${ejercicio.id}`);
                      }}
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
      </div>

      {/* Panel central - Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header del chat */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Mentorify</h1>
                {selectedEjercicio && (
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{selectedEjercicio.titulo}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Pistas:</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                {pistasEntregadas}/3
              </span>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(estadoEstudiante)}`}>
              {estadoEstudiante.replace('_', ' ')}
            </div>
            <button onClick={() => setRightPanelOpen(!rightPanelOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
              {rightPanelOpen ? <ChevronLeft className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
            </button>
          </div>
        </div>

        {/* Alerta de error */}
        {error && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
            <div className="flex items-center space-x-2 text-yellow-800 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Área de mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-3">
              <Brain className="w-12 h-12 opacity-30" />
              <p className="text-sm">Cargando ejercicio...</p>
            </div>
          )}
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                message.role === 'assistant'
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                  : 'bg-gray-200'
              }`}>
                {message.role === 'assistant' ? (
                  <Brain className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-gray-600"></span>
                )}
              </div>
              <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-tr-none'
                  : 'bg-white border border-gray-200 rounded-tl-none'
              }`}>
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu intento o pregunta..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || sesionId === null}
                className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Mentorify te guía con preguntas socráticas, no da respuestas directas.
            </p>
          </div>
        </div>
      </div>

      {/* Panel derecho - Enunciado y conceptos */}
      {rightPanelOpen && selectedEjercicio && (
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Enunciado</h2>
              <button onClick={() => setRightPanelOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{selectedEjercicio.titulo}</h3>
              <p className="text-sm text-gray-600 mb-3">{selectedEjercicio.enunciado}</p>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getNivelColor(selectedEjercicio.nivel_dificultad)}`}>
                  {selectedEjercicio.nivel_dificultad}
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700">
                  {selectedEjercicio.dominio}
                </span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span>Conceptos clave</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedEjercicio.conceptos_clave.map((concepto, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                  >
                    {concepto}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>Progreso de la sesión</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Pistas usadas</span>
                  <span className="font-medium text-gray-900">{pistasEntregadas}/3</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${(pistasEntregadas / 3) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Errores consecutivos</span>
                  <span className={`font-medium ${erroresConsecutivos > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {erroresConsecutivos}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Estado</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getEstadoColor(estadoEstudiante)}`}>
                    {estadoEstudiante.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">Recordatorio</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Mentorify te guía con preguntas. Construye tu propio razonamiento paso a paso.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
