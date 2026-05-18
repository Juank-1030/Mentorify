import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, TrendingUp, Award, Calendar, ChevronRight, BookOpen, Target, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ProgressPage: React.FC = () => {
  const navigate = useNavigate();

  const progresoPorDominio = [
    { dominio: 'Algoritmos', completados: 4, totales: 6, porcentaje: 67 },
    { dominio: 'Estructuras de Datos', completados: 2, totales: 5, porcentaje: 40 },
    { dominio: 'POO', completados: 3, totales: 4, porcentaje: 75 },
    { dominio: 'Lógica Matemática', completados: 1, totales: 3, porcentaje: 33 }
  ];

  const temasDominados = [
    { nombre: 'Búsqueda Binaria', nivel: 'Dominado', color: 'green' },
    { nombre: 'Recursión Básica', nivel: 'Dominado', color: 'green' },
    { nombre: 'Herencia y Polimorfismo', nivel: 'Dominado', color: 'green' },
    { nombre: 'Complejidad Big-O', nivel: 'En progreso', color: 'yellow' },
    { nombre: 'Árboles Binarios', nivel: 'Por reforzar', color: 'red' },
    { nombre: 'Tablas Hash', nivel: 'Por reforzar', color: 'red' }
  ];

  const historialSesiones = [
    { fecha: '2025-01-15', ejercicio: 'Búsqueda Binaria', completado: true, pistas: 2, errores: 1 },
    { fecha: '2025-01-14', ejercicio: 'Bubble Sort', completado: true, pistas: 1, errores: 0 },
    { fecha: '2025-01-13', ejercicio: 'Lista Enlazada', completado: false, pistas: 3, errores: 4 },
    { fecha: '2025-01-12', ejercicio: 'Factorial Recursivo', completado: true, pistas: 1, errores: 1 },
    { fecha: '2025-01-11', ejercicio: 'Merge Sort', completado: true, pistas: 2, errores: 2 },
    { fecha: '2025-01-10', ejercicio: 'Árbol BST', completado: false, pistas: 3, errores: 5 },
    { fecha: '2025-01-09', ejercicio: 'Herencia POO', completado: true, pistas: 1, errores: 0 },
    { fecha: '2025-01-08', ejercicio: 'Tabla Hash', completado: false, pistas: 3, errores: 3 }
  ];

  const metricasGenerales = {
    sesionesTotales: 24,
    ejerciciosCompletados: 15,
    tasaCompletacion: 62.5,
    promedioPistas: 1.8,
    promedioErrores: 1.5,
    tiempoPromedio: '18 min'
  };

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  const distribucionEstadoData = [
    { name: 'Completados', value: 15 },
    { name: 'En progreso', value: 6 },
    { name: 'Por iniciar', value: 3 }
  ];

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
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/chat')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Volver al chat
              </button>
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>Nuevo ejercicio</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tu Progreso</h1>
          <p className="text-gray-600">Visualiza tu aprendizaje y identifica áreas de mejora</p>
        </div>

        {/* Métricas generales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-600">Sesiones totales</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{metricasGenerales.sesionesTotales}</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-600">Ejercicios completados</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{metricasGenerales.ejerciciosCompletados}</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">Tasa de completación</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{metricasGenerales.tasaCompletacion}%</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-2">
              <Target className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-600">Tiempo promedio</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{metricasGenerales.tiempoPromedio}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Progreso por dominio */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Progreso por Dominio</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={progresoPorDominio}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dominio" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="porcentaje" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribución de estado */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Distribución de Ejercicios</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distribucionEstadoData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const { name, percent } = props;
                    return `${name} ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distribucionEstadoData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Temas dominados */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Temas Dominados</h2>
            <div className="space-y-3">
              {temasDominados.map((tema, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-900">{tema.nombre}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    tema.color === 'green' ? 'bg-green-100 text-green-700' :
                    tema.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {tema.nivel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Temas a reforzar */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Temas a Reforzar</h2>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800">Árboles Binarios de Búsqueda</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Has tenido dificultades con la inserción y el recorrido de BST. 
                      Te recomendamos repasar los conceptos de recursión y propiedades de BST.
                    </p>
                    <button className="mt-3 text-red-700 font-medium text-sm hover:text-red-800">
                      Ver ejercicios de refuerzo →
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-800">Tablas Hash</h3>
                    <p className="text-sm text-orange-700 mt-1">
                      El manejo de colisiones necesita más práctica. 
                      Repasa encadenamiento y direccionamiento abierto.
                    </p>
                    <button className="mt-3 text-orange-700 font-medium text-sm hover:text-orange-800">
                      Ver ejercicios de refuerzo →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historial de sesiones */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Historial de Sesiones</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Fecha</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Ejercicio</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Estado</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Pistas</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Errores</th>
                </tr>
              </thead>
              <tbody>
                {historialSesiones.map((sesion, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">{sesion.fecha}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{sesion.ejercicio}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        sesion.completado 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {sesion.completado ? 'Completado' : 'Incompleto'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">{sesion.pistas}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-sm font-medium ${
                        sesion.errores > 2 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {sesion.errores}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">¿Listo para continuar aprendiendo?</h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            Elige tu próximo ejercicio y sigue construyendo tu conocimiento con Mentorify.
          </p>
          <button
            onClick={() => navigate('/chat')}
            className="bg-white text-blue-600 px-8 py-4 rounded-full font-medium hover:bg-blue-50 transition-colors inline-flex items-center space-x-2"
          >
            <span>Comenzar nuevo ejercicio</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
