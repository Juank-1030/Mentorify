import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send, Lightbulb, TrendingUp, ChevronRight, ChevronLeft, X, Brain,
  AlertCircle, Plus, Paperclip, ClipboardList, History, ChevronDown,
  CheckCircle, Clock
} from 'lucide-react';
import {
  iniciarSesion, iniciarSesionLibre, interactuar, obtenerEjercicios,
  generarQuiz, evaluarQuiz, subirArchivo, obtenerHistorial,
  Ejercicio as EjercicioType, InteraccionResponse,
  QuizGeneradoResponse, QuizResultado, SesionHistorial
} from '../services/api';
import QuizPanel, { QuizData, QuizFeedback } from '../components/QuizPanel';

interface Mensaje {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  archivoAdjunto?: string;
}

// Estudiante ID persistente en localStorage
const getStudentId = (): string => {
  let id = localStorage.getItem('mentorify_student_id');
  if (!id) {
    id = `student_${Date.now()}`;
    localStorage.setItem('mentorify_student_id', id);
  }
  return id;
};

const NIVELES = ['todos', 'basico', 'medio', 'avanzado'] as const;

const ChatPage: React.FC = () => {
  const { ejercicioId } = useParams<{ ejercicioId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Estado principal ────────────────────────────────────────
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

  // ── Nueva conversación ──────────────────────────────────────
  const [nuevoTema, setNuevoTema] = useState('');
  const [showNuevoTema, setShowNuevoTema] = useState(false);

  // ── Filtros de ejercicios ───────────────────────────────────
  const [filtroNivel, setFiltroNivel] = useState<string>('todos');

  // ── Historial ───────────────────────────────────────────────
  const [historial, setHistorial] = useState<SesionHistorial[]>([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // ── Quiz ────────────────────────────────────────────────────
  const [quizActivo, setQuizActivo] = useState<QuizData | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // ── Archivo adjunto ─────────────────────────────────────────
  const [archivoAdjunto, setArchivoAdjunto] = useState<{ nombre: string; texto: string } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const estudianteId = getStudentId();

  // ── Efectos ─────────────────────────────────────────────────
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { cargarEjercicios(); }, []);
  useEffect(() => {
    if (ejercicioId && ejercicios.length > 0) {
      const ej = ejercicios.find(e => e.id === parseInt(ejercicioId));
      if (ej && ej.id !== selectedEjercicio?.id) {
        setSelectedEjercicio(ej);
        iniciarSesionConEjercicio(ej);
      }
    }
  }, [ejercicioId]);

  // ── Carga de ejercicios ─────────────────────────────────────
  const cargarEjercicios = async () => {
    const temaLibre = searchParams.get('tema');
    try {
      const lista = await obtenerEjercicios();
      setEjercicios(lista);
      if (temaLibre) {
        await iniciarSesionLibreConTema(temaLibre);
      } else if (lista.length > 0) {
        const ej = ejercicioId
          ? lista.find(e => e.id === parseInt(ejercicioId)) ?? lista[0]
          : lista[0];
        setSelectedEjercicio(ej);
        iniciarSesionConEjercicio(ej);
      }
    } catch {
      setError('No se pudo conectar con el servidor. Backend: http://localhost:8000');
      setEjercicios(ejerciciosRespaldo);
      const temaLibre2 = searchParams.get('tema');
      if (temaLibre2) {
        await iniciarSesionLibreConTema(temaLibre2);
      } else {
        setSelectedEjercicio(ejerciciosRespaldo[0]);
        iniciarSesionConEjercicio(ejerciciosRespaldo[0]);
      }
    }
  };

  // ── Sesión con ejercicio predefinido ────────────────────────
  const iniciarSesionConEjercicio = async (ejercicio: EjercicioType) => {
    setQuizActivo(null);
    try {
      setError(null);
      const resp = await iniciarSesion(ejercicio.id, estudianteId);
      setSesionId(resp.sesion_id);
      setMessages([{ id: 'welcome', role: 'assistant', content: resp.mensaje_bienvenida, timestamp: new Date() }]);
      setPistasEntregadas(0); setErroresConsecutivos(0); setEstadoEstudiante('INICIO_SESION');
    } catch {
      setError('No se pudo iniciar la sesión.');
      setMessages([{
        id: 'welcome', role: 'assistant', timestamp: new Date(),
        content: `¡Hola! Soy Mentorify. 🎓\n\nHoy trabajaremos en: **${ejercicio.titulo}**\n\n${ejercicio.enunciado}\n\n¿Qué piensas sobre este ejercicio?`
      }]);
    }
  };

  // ── Sesión libre (tema personalizado) ───────────────────────
  const iniciarSesionLibreConTema = async (tema: string) => {
    setQuizActivo(null);
    try {
      setError(null);
      const resp = await iniciarSesionLibre(tema, estudianteId);
      setSesionId(resp.sesion_id);
      setSelectedEjercicio(resp.ejercicio);
      setMessages([{ id: 'welcome', role: 'assistant', content: resp.mensaje_bienvenida, timestamp: new Date() }]);
      setPistasEntregadas(0); setErroresConsecutivos(0); setEstadoEstudiante('INICIO_SESION');
    } catch {
      setError('No se pudo iniciar la sesión libre.');
      setMessages([{
        id: 'welcome', role: 'assistant', timestamp: new Date(),
        content: `¡Hola! Soy Mentorify. Hoy exploraremos: **${tema}**\n\n¿Qué sabes ya sobre este tema?`
      }]);
    }
  };

  const handleNuevoTema = async () => {
    if (!nuevoTema.trim()) return;
    const tema = nuevoTema.trim();
    setNuevoTema(''); setShowNuevoTema(false);
    await iniciarSesionLibreConTema(tema);
  };

  // ── Enviar mensaje ──────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!inputValue.trim() && !archivoAdjunto || isLoading || sesionId === null) return;

    let contenidoMensaje = inputValue;
    let archivoInfo: string | undefined;

    if (archivoAdjunto) {
      archivoInfo = archivoAdjunto.nombre;
      contenidoMensaje = inputValue
        ? `${inputValue}\n\n[Archivo adjunto: ${archivoAdjunto.nombre}]\n${archivoAdjunto.texto}`
        : `[Archivo adjunto: ${archivoAdjunto.nombre}]\n${archivoAdjunto.texto}`;
    }

    const userMsg: Mensaje = {
      id: Date.now().toString(), role: 'user',
      content: inputValue || `📎 ${archivoAdjunto?.nombre}`,
      timestamp: new Date(), archivoAdjunto: archivoInfo
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setArchivoAdjunto(null);
    setIsLoading(true); setError(null);

    try {
      const resp: InteraccionResponse = await interactuar(sesionId, contenidoMensaje);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: resp.respuesta, timestamp: new Date()
      }]);
      setPistasEntregadas(resp.pistas_entregadas);
      setErroresConsecutivos(resp.errores_consecutivos);
      setEstadoEstudiante(resp.estado_estudiante);
    } catch {
      setError('No se pudo obtener respuesta. Modo offline.');
      const respaldos = [
        '🤔 Interesante planteamiento. ¿Qué conceptos clave podrías aplicar aquí?',
        '💡 Buen intento. ¿Qué pasaría si cambiaras ese enfoque?',
        '🎓 Estás en el camino correcto. ¿Cuál sería el caso más simple de este problema?',
      ];
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant', timestamp: new Date(),
        content: respaldos[Math.floor(Math.random() * respaldos.length)]
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  // ── Archivo adjunto ─────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingFile(true);
    try {
      const resp = await subirArchivo(file);
      setArchivoAdjunto({ nombre: resp.filename || file.name, texto: resp.texto_extraido });
    } catch {
      setError('No se pudo subir el archivo. Verifica que el backend esté corriendo.');
    } finally {
      setUploadingFile(false);
    }
  };

  // ── Quiz ────────────────────────────────────────────────────
  const handleGenerarQuiz = async () => {
    if (sesionId === null) return;
    setLoadingQuiz(true);
    try {
      const resp = await generarQuiz(sesionId, estudianteId);
      setQuizActivo({
        quiz_id: resp.quiz_id,
        tema: resp.tema,
        preguntas: resp.preguntas
      } as QuizData);
    } catch {
      setError('No se pudo generar el quiz. Verifica que el backend esté corriendo.');
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleEvaluarQuiz = async (respuestas: Record<string, string>): Promise<QuizFeedback> => {
    if (!quizActivo) throw new Error('No hay quiz activo');
    const res = await evaluarQuiz(quizActivo.quiz_id, respuestas);
    // Agregar mensaje al chat con el resultado
    setMessages(prev => [...prev, {
      id: `quiz_${Date.now()}`, role: 'assistant', timestamp: new Date(),
      content: `📊 **Resultado del quiz**: ${res.puntaje}% (${res.correctas}/${res.total} correctas)\n\n${
        res.puntaje >= 80 ? '¡Excelente dominio del tema! 🎉' :
        res.puntaje >= 60 ? '¡Buen trabajo! Hay algunos conceptos que reforzar. 💪' :
        'Sigamos practicando juntos para afianzar estos conceptos. 📚'
      }`
    }]);
    return res as unknown as QuizFeedback;
  };

  // ── Historial ───────────────────────────────────────────────
  const toggleHistorial = async () => {
    if (!showHistorial && historial.length === 0) {
      setLoadingHistorial(true);
      try {
        const data = await obtenerHistorial(estudianteId);
        setHistorial(data);
      } catch { /* silencioso */ }
      finally { setLoadingHistorial(false); }
    }
    setShowHistorial(h => !h);
  };

  // ── Helpers de color ────────────────────────────────────────
  const getEstadoColor = (estado: string) => {
    const m: Record<string, string> = {
      INICIO_SESION: 'bg-blue-100 text-blue-700', EXPLORACION_CONCEPTUAL: 'bg-blue-100 text-blue-700',
      INTENTO_INICIAL: 'bg-yellow-100 text-yellow-700', AVANCE_PARCIAL: 'bg-green-100 text-green-700',
      ERROR_UNICO: 'bg-orange-100 text-orange-700', ESTANCAMIENTO: 'bg-red-100 text-red-700',
      PISTA_AUXILIO: 'bg-purple-100 text-purple-700', COMPLETADO: 'bg-green-100 text-green-700'
    };
    return m[estado] || 'bg-gray-100 text-gray-700';
  };
  const getNivelColor = (nivel: string) => ({
    basico: 'bg-green-100 text-green-700', medio: 'bg-yellow-100 text-yellow-700',
    avanzado: 'bg-red-100 text-red-700'
  }[nivel] || 'bg-gray-100 text-gray-700');

  // ── Ejercicios de respaldo (debe ir ANTES de ejerciciosAMostrar) ──
  const ejerciciosRespaldo: EjercicioType[] = [
    { id: 1, titulo: 'Búsqueda Binaria en Python', enunciado: 'Implementa búsqueda binaria.', dominio: 'algoritmos', nivel_dificultad: 'medio', conceptos_clave: ['búsqueda binaria', 'O(log n)'] },
    { id: 2, titulo: 'Complejidad Bubble Sort', enunciado: 'Analiza por qué Bubble Sort es O(n²).', dominio: 'algoritmos', nivel_dificultad: 'basico', conceptos_clave: ['complejidad', 'Big-O'] },
    { id: 3, titulo: 'Lista Enlazada vs Arreglo', enunciado: 'Compara estas estructuras.', dominio: 'estructuras de datos', nivel_dificultad: 'basico', conceptos_clave: ['listas', 'arreglos'] },
    { id: 4, titulo: 'Recursión: Factorial', enunciado: 'Implementa factorial recursivo.', dominio: 'algoritmos', nivel_dificultad: 'basico', conceptos_clave: ['recursión', 'caso base'] },
    { id: 5, titulo: 'BST: Inserción', enunciado: 'Implementa inserción en BST.', dominio: 'estructuras de datos', nivel_dificultad: 'medio', conceptos_clave: ['árboles', 'BST'] },
    { id: 6, titulo: 'Herencia y Polimorfismo', enunciado: 'Crea jerarquía de clases.', dominio: 'POO', nivel_dificultad: 'medio', conceptos_clave: ['herencia', 'polimorfismo'] },
    { id: 7, titulo: 'Tabla Hash: Colisiones', enunciado: 'Explica manejo de colisiones.', dominio: 'estructuras de datos', nivel_dificultad: 'avanzado', conceptos_clave: ['hash', 'colisiones'] },
    { id: 8, titulo: 'Merge Sort', enunciado: 'Implementa Merge Sort.', dominio: 'algoritmos', nivel_dificultad: 'medio', conceptos_clave: ['merge sort', 'divide y vencerás'] },
    { id: 9, titulo: 'Big-O: Loops Anidados', enunciado: 'Determina complejidad de bucles.', dominio: 'algoritmos', nivel_dificultad: 'basico', conceptos_clave: ['Big-O', 'análisis'] },
    { id: 10, titulo: 'BFS vs DFS', enunciado: 'Compara BFS y DFS en grafos.', dominio: 'estructuras de datos', nivel_dificultad: 'avanzado', conceptos_clave: ['grafos', 'BFS', 'DFS'] }
  ];

  // ── Ejercicios filtrados ────────────────────────────────────
  const ejerciciosAMostrar = ejercicios.length > 0 ? ejercicios : ejerciciosRespaldo;
  const ejerciciosFiltrados = filtroNivel === 'todos'
    ? ejerciciosAMostrar
    : ejerciciosAMostrar.filter(e => e.nivel_dificultad === filtroNivel);

  const groupedEjercicios = ejerciciosFiltrados.reduce((acc, ej) => {
    if (!acc[ej.dominio]) acc[ej.dominio] = [];
    acc[ej.dominio].push(ej);
    return acc;
  }, {} as Record<string, EjercicioType[]>);

  // ════════════════════════════════════════════════════════════
  return (
    <div className="h-screen flex bg-gray-50">

      {/* ── Sidebar izquierdo ──────────────────────────────── */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex-shrink-0`}>
        <div className="p-4 h-full flex flex-col">

          {/* Logo */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-gray-900">Mentorify</h2>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-gray-100 rounded">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Nueva conversación */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <button
              onClick={() => setShowNuevoTema(!showNuevoTema)}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva conversación</span>
            </button>
            {showNuevoTema && (
              <div className="mt-2 space-y-2">
                <input
                  type="text" value={nuevoTema} autoFocus
                  onChange={e => setNuevoTema(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleNuevoTema()}
                  placeholder="¿Qué quieres aprender?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={handleNuevoTema} disabled={!nuevoTema.trim()}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >Comenzar a aprender</button>
              </div>
            )}
          </div>

          {/* Filtros de nivel */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Ejercicios guiados</p>
            <div className="flex space-x-1 flex-wrap gap-y-1">
              {NIVELES.map(n => (
                <button key={n} onClick={() => setFiltroNivel(n)}
                  className={`px-2 py-1 rounded text-xs font-medium capitalize transition-colors ${
                    filtroNivel === n ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {n === 'todos' ? 'Todos' : n.charAt(0).toUpperCase() + n.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de ejercicios */}
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
            {Object.entries(groupedEjercicios).map(([dominio, lista]) => (
              <div key={dominio}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 px-1">
                  {dominio}
                </h3>
                <div className="space-y-0.5">
                  {lista.map(ej => (
                    <button key={ej.id}
                      onClick={() => { setSelectedEjercicio(ej); navigate(`/chat/${ej.id}`); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedEjercicio?.id === ej.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="font-medium truncate">{ej.titulo}</div>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${getNivelColor(ej.nivel_dificultad)}`}>
                        {ej.nivel_dificultad}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(groupedEjercicios).length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No hay ejercicios en este nivel.</p>
            )}
          </div>

          {/* Historial */}
          <div className="border-t border-gray-200 pt-3 mt-3">
            <button onClick={toggleHistorial}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4" />
                <span className="font-medium">Historial</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showHistorial ? 'rotate-180' : ''}`} />
            </button>

            {showHistorial && (
              <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                {loadingHistorial && <p className="text-xs text-gray-400 text-center py-2">Cargando...</p>}
                {!loadingHistorial && historial.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">Sin sesiones previas</p>
                )}
                {historial.map(s => (
                  <div key={s.sesion_id}
                    className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800 truncate max-w-[140px]">{s.tema}</span>
                      {s.completado
                        ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        : <Clock className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                    </div>
                    <span className="text-gray-400">
                      {new Date(s.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                      {' · '}{s.pistas_usadas} pistas
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Panel central ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Header del chat */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0 z-10">
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
                <h1 className="font-bold text-gray-900 text-sm">Mentorify</h1>
                {selectedEjercicio && (
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{selectedEjercicio.titulo}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 hidden sm:block">Pistas:</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">{pistasEntregadas}/3</span>
            <div className={`px-2 py-1 rounded-full text-xs font-medium hidden sm:block ${getEstadoColor(estadoEstudiante)}`}>
              {estadoEstudiante.replace(/_/g, ' ')}
            </div>

            {/* Botón quiz */}
            <button
              onClick={handleGenerarQuiz}
              disabled={sesionId === null || loadingQuiz}
              title="Generar evaluación"
              className="flex items-center space-x-1 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium hover:bg-purple-100 disabled:opacity-50 transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{loadingQuiz ? 'Generando...' : 'Quiz'}</span>
            </button>

            <button onClick={() => setRightPanelOpen(!rightPanelOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
              {rightPanelOpen ? <ChevronLeft className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex-shrink-0">
            <div className="flex items-center space-x-2 text-yellow-800 text-xs">
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

          {messages.map(msg => (
            <div key={msg.id}
              className={`flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'assistant' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-200'
              }`}>
                {msg.role === 'assistant' ? <Brain className="w-5 h-5 text-white" /> : <span className="text-gray-600">👤</span>}
              </div>
              <div className={`max-w-[72%] rounded-2xl px-4 py-3 ${
                msg.role === 'user' ? 'bg-blue-500 text-white rounded-tr-none' : 'bg-white border border-gray-200 rounded-tl-none'
              }`}>
                {msg.archivoAdjunto && (
                  <div className={`flex items-center space-x-1.5 text-xs mb-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{msg.archivoAdjunto}</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                <div className="flex space-x-1.5">
                  {[0, 0.15, 0.3].map((d, i) => (
                    <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto space-y-2">
            {/* Archivo adjunto preview */}
            {archivoAdjunto && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <Paperclip className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800 flex-1 truncate">{archivoAdjunto.nombre}</span>
                <button onClick={() => setArchivoAdjunto(null)} className="text-blue-500 hover:text-blue-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-end space-x-2">
              {/* Botón adjuntar archivo */}
              <input ref={fileInputRef} type="file" className="hidden"
                accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                title="Adjuntar archivo (PDF, TXT, DOC, imagen)"
                className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {uploadingFile ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Paperclip className="w-5 h-5" />
                )}
              </button>

              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={archivoAdjunto ? 'Escribe un comentario sobre el archivo...' : 'Escribe tu intento o pregunta...'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  rows={1} style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>

              <button
                onClick={handleSendMessage}
                disabled={(!inputValue.trim() && !archivoAdjunto) || isLoading || sesionId === null}
                className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Mentorify guía con preguntas socráticas · PDF, TXT, imágenes admitidos
            </p>
          </div>
        </div>

        {/* Quiz overlay */}
        {quizActivo && (
          <QuizPanel
            quiz={quizActivo}
            onClose={() => setQuizActivo(null)}
            onSubmit={handleEvaluarQuiz}
          />
        )}
      </div>

      {/* ── Panel derecho: Enunciado + Progreso ────────────── */}
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
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">{selectedEjercicio.titulo}</h3>
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">{selectedEjercicio.enunciado}</p>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getNivelColor(selectedEjercicio.nivel_dificultad)}`}>
                  {selectedEjercicio.nivel_dificultad}
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700">
                  {selectedEjercicio.dominio}
                </span>
              </div>
            </div>

            {selectedEjercicio.conceptos_clave?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2 text-sm">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <span>Conceptos clave</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEjercicio.conceptos_clave.map((c, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{c}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>Progreso de la sesión</span>
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Pistas usadas</span>
                    <span className="font-medium text-gray-900">{pistasEntregadas}/3</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${(pistasEntregadas / 3) * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Errores consecutivos</span>
                  <span className={`font-medium ${erroresConsecutivos > 0 ? 'text-red-600' : 'text-green-600'}`}>{erroresConsecutivos}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Estado</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getEstadoColor(estadoEstudiante)}`}>
                    {estadoEstudiante.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Acceso rápido al quiz desde panel */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleGenerarQuiz}
                disabled={sesionId === null || loadingQuiz}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-sm font-medium hover:bg-purple-100 disabled:opacity-50 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                <span>{loadingQuiz ? 'Generando quiz...' : 'Evaluar mis conocimientos'}</span>
              </button>
            </div>

            <div className="pt-2">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-700">
                    Mentorify te guía con preguntas. Construye tu propio razonamiento paso a paso.
                  </p>
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
