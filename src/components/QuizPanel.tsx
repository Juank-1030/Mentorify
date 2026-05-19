import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Award, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';

export interface Pregunta {
  id: number;
  pregunta: string;
  opciones: { A: string; B: string; C: string; D: string };
}

export interface QuizData {
  quiz_id: number;
  tema: string;
  preguntas: Pregunta[];
}

export interface QuizFeedback {
  puntaje: number;
  correctas: number;
  total: number;
  feedback: Record<string, {
    correcta: boolean;
    respuesta_usuario: string;
    respuesta_correcta: string;
    explicacion: string;
  }>;
}

interface QuizPanelProps {
  quiz: QuizData;
  onClose: () => void;
  onSubmit: (respuestas: Record<string, string>) => Promise<QuizFeedback>;
}

const OPCION_LABELS = ['A', 'B', 'C', 'D'] as const;

const QuizPanel: React.FC<QuizPanelProps> = ({ quiz, onClose, onSubmit }) => {
  const [pagina, setPagina] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<QuizFeedback | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [vistaRevision, setVistaRevision] = useState(0);

  const preguntaActual = quiz.preguntas[pagina];
  const totalPreguntas = quiz.preguntas.length;
  const respondidas = Object.keys(respuestas).length;
  const todasRespondidas = respondidas === totalPreguntas;

  const seleccionarOpcion = (opcion: string) => {
    setRespuestas(prev => ({ ...prev, [String(preguntaActual.id)]: opcion }));
  };

  const handleSubmit = async () => {
    if (!todasRespondidas) return;
    setEnviando(true);
    try {
      const res = await onSubmit(respuestas);
      setResultado(res);
      setVistaRevision(0);
    } finally {
      setEnviando(false);
    }
  };

  const getColorPuntaje = (p: number) =>
    p >= 80 ? 'text-green-600' : p >= 60 ? 'text-yellow-600' : 'text-red-600';

  const getBgPuntaje = (p: number) =>
    p >= 80 ? 'from-green-50 to-emerald-50 border-green-200' : p >= 60 ? 'from-yellow-50 to-amber-50 border-yellow-200' : 'from-red-50 to-rose-50 border-red-200';

  // ── Vista de resultados ────────────────────────────────────────
  if (resultado) {
    const preguntaRevision = quiz.preguntas[vistaRevision];
    const fb = resultado.feedback[String(preguntaRevision.id)];

    return (
      <div className="absolute inset-0 bg-white z-20 flex flex-col">
        {/* Header resultados */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Resultados del Quiz</h2>
            <p className="text-sm text-gray-500">{quiz.tema}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Score card */}
          <div className={`rounded-2xl border-2 p-6 bg-gradient-to-br ${getBgPuntaje(resultado.puntaje)} text-center`}>
            <Award className={`w-12 h-12 mx-auto mb-3 ${getColorPuntaje(resultado.puntaje)}`} />
            <div className={`text-5xl font-bold mb-1 ${getColorPuntaje(resultado.puntaje)}`}>
              {resultado.puntaje}%
            </div>
            <p className="text-gray-700 font-medium">
              {resultado.correctas} de {resultado.total} correctas
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {resultado.puntaje >= 80
                ? '¡Excelente! Dominas bien este tema.'
                : resultado.puntaje >= 60
                ? 'Buen trabajo. Hay algunos conceptos por reforzar.'
                : 'Sigue practicando. Revisa los conceptos y vuelve a intentarlo.'}
            </p>
          </div>

          {/* Revisión pregunta por pregunta */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Revisión detallada</h3>
              <span className="text-sm text-gray-500">Pregunta {vistaRevision + 1} / {totalPreguntas}</span>
            </div>

            <div className={`rounded-xl border-2 p-5 ${fb?.correcta ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-start space-x-3 mb-4">
                {fb?.correcta
                  ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  : <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                <p className="font-medium text-gray-900">{preguntaRevision.pregunta}</p>
              </div>

              <div className="space-y-2 mb-4">
                {OPCION_LABELS.map(op => {
                  const esUsuario = fb?.respuesta_usuario === op;
                  const esCorrecta = fb?.respuesta_correcta === op;
                  return (
                    <div key={op} className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm ${
                      esCorrecta ? 'bg-green-100 text-green-800 font-medium' :
                      esUsuario && !esCorrecta ? 'bg-red-100 text-red-800' :
                      'bg-white/60 text-gray-600'
                    }`}>
                      <span className="font-bold w-4">{op}.</span>
                      <span>{preguntaRevision.opciones[op]}</span>
                      {esCorrecta && <CheckCircle className="w-4 h-4 ml-auto text-green-600" />}
                      {esUsuario && !esCorrecta && <XCircle className="w-4 h-4 ml-auto text-red-600" />}
                    </div>
                  );
                })}
              </div>

              {fb?.explicacion && (
                <div className="bg-white/80 rounded-lg px-4 py-3 text-sm text-gray-700">
                  <span className="font-semibold">Explicación: </span>{fb.explicacion}
                </div>
              )}
            </div>

            <div className="flex justify-between mt-3">
              <button
                onClick={() => setVistaRevision(v => Math.max(0, v - 1))}
                disabled={vistaRevision === 0}
                className="flex items-center space-x-1 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
              <button
                onClick={() => setVistaRevision(v => Math.min(totalPreguntas - 1, v + 1))}
                disabled={vistaRevision === totalPreguntas - 1}
                className="flex items-center space-x-1 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex justify-between flex-shrink-0">
          <button
            onClick={() => { setResultado(null); setRespuestas({}); setPagina(0); }}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reintentar</span>
          </button>
          <button onClick={onClose} className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
            Volver al chat
          </button>
        </div>
      </div>
    );
  }

  // ── Vista de preguntas ─────────────────────────────────────────
  return (
    <div className="absolute inset-0 bg-white z-20 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">Evaluación de conocimientos</h2>
          <p className="text-sm text-gray-500">{quiz.tema}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-4 pb-2 flex-shrink-0">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Pregunta {pagina + 1} de {totalPreguntas}</span>
          <span>{respondidas}/{totalPreguntas} respondidas</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${((pagina + 1) / totalPreguntas) * 100}%` }}
          />
        </div>
        {/* Dots */}
        <div className="flex space-x-1.5 mt-2 justify-center">
          {quiz.preguntas.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setPagina(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === pagina ? 'bg-blue-500' :
                respuestas[String(p.id)] ? 'bg-green-400' :
                'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Pregunta actual */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="font-semibold text-gray-900 text-base leading-relaxed">
              {pagina + 1}. {preguntaActual.pregunta}
            </p>
          </div>

          <div className="space-y-3">
            {OPCION_LABELS.map(op => {
              const seleccionada = respuestas[String(preguntaActual.id)] === op;
              return (
                <button
                  key={op}
                  onClick={() => seleccionarOpcion(op)}
                  className={`w-full text-left flex items-center space-x-4 px-4 py-3.5 rounded-xl border-2 transition-all ${
                    seleccionada
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    seleccionada ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {op}
                  </span>
                  <span className="text-sm">{preguntaActual.opciones[op]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer navegación */}
      <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => setPagina(p => Math.max(0, p - 1))}
          disabled={pagina === 0}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        {pagina < totalPreguntas - 1 ? (
          <button
            onClick={() => setPagina(p => p + 1)}
            className="flex items-center space-x-2 px-5 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
          >
            <span>Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!todasRespondidas || enviando}
            className="px-6 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
          >
            {enviando ? 'Evaluando...' : `Finalizar (${respondidas}/${totalPreguntas})`}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizPanel;
