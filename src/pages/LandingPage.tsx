import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, BookOpen, MessageCircle, Target, Award, ChevronRight, Play } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [tema, setTema] = useState('');

  const handleComenzar = () => {
    if (tema.trim()) {
      navigate(`/chat?tema=${encodeURIComponent(tema.trim())}`);
    } else {
      navigate('/chat');
    }
  };

  const features = [
    {
      icon: MessageCircle,
      title: 'Guía Socrática',
      description: 'Aprende mediante preguntas que activan tu razonamiento, no con respuestas directas.'
    },
    {
      icon: Target,
      title: 'Pistas Adaptativas',
      description: 'Recibe ayuda personalizada según tu nivel de comprensión y progreso.'
    },
    {
      icon: Brain,
      title: 'Análisis de Falencias',
      description: 'Identifica tus áreas de mejora con retroalimentación inteligente.'
    },
    {
      icon: Award,
      title: 'Retroalimentación Inteligente',
      description: 'Construye tu propio conocimiento con guía experta en cada paso.'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Escribe tu consulta o ejercicio',
      description: 'Plantea tu duda o el ejercicio que quieres resolver.'
    },
    {
      number: '02',
      title: 'Mentorify te guía con preguntas',
      description: 'Recibe preguntas socráticas que activan tu razonamiento.'
    },
    {
      number: '03',
      title: 'Construyes tu propio razonamiento',
      description: 'Desarrollas la solución paso a paso con comprensión real.'
    },
    {
      number: '04',
      title: 'Completas con comprensión real',
      description: 'Logras el ejercicio habiendo aprendido verdaderamente.'
    }
  ];

  const testimonials = [
    {
      name: 'María García',
      role: 'Estudiante de Ingeniería',
      content: 'Mentorify me ayudó a entender algoritmos de verdad, no solo a memorizar. Ahora puedo resolver problemas nuevos por mi misma.',
      rating: 5
    },
    {
      name: 'Carlos Rodríguez',
      role: 'Estudiante de Sistemas',
      content: 'Los ejercicios interactivos son increíbles. Pasé de reprobar cálculo a sacar la mejor nota de mi clase.',
      rating: 5
    },
    {
      name: 'Ana Martínez',
      role: 'Estudiante de Matemáticas',
      content: 'Es como tener un tutor personal 24/7. Las preguntas socráticas me hacen pensar de forma diferente.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Mentorify</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Características</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">Cómo funciona</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonios</a>
            </nav>
            
            <button
              onClick={() => navigate('/chat')}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Probar ahora
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Potenciado con Inteligencia Artificial
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Tu mentor académico
            <span className="block bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 bg-clip-text text-transparent">
              inteligente
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Aprende cualquier tema, evalúa tu comprensión y refuerza tus debilidades
            con explicaciones, cuestionarios y recursos personalizados.
          </p>

          <div className="max-w-xl mx-auto mb-6">
            <div className="flex items-center bg-white border-2 border-gray-200 rounded-2xl p-2 shadow-sm hover:border-blue-300 focus-within:border-blue-400 transition-colors">
              <input
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComenzar()}
                placeholder="¿Qué quieres aprender hoy? Ej: fotosíntesis, álgebra lineal..."
                className="flex-1 px-4 py-2 text-gray-700 bg-transparent focus:outline-none text-base"
              />
              <button
                onClick={handleComenzar}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center space-x-2 flex-shrink-0"
              >
                <span>Comenzar</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Escribe un tema o deja en blanco para explorar ejercicios guiados
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto bg-white text-gray-900 px-8 py-4 rounded-full font-medium border border-gray-200 hover:border-gray-300 transition-colors flex items-center justify-center space-x-2">
              <Play className="w-5 h-5" />
              <span>Ver demostración</span>
            </button>
          </div>
        </div>
      </section>

      {/* Chat Preview */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gray-100 px-4 py-3 flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-500 ml-4">mentorify.ai</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-lg">
                  <p className="text-gray-800">
                    ¡Hola! Soy <strong>Mentorify</strong>, tu mentor académico con IA. 
                    <br /><br />
                    ¿Qué tema te gustaría aprender hoy? Puedo explicarte cualquier concepto y luego evaluar tu comprensión.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start justify-end space-x-3">
                <div className="bg-blue-500 text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-lg">
                  <p>Explícame la fotosíntesis y sus fases</p>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600">👤</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-purple-600 font-semibold text-sm uppercase tracking-wider">Proceso</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">¿Cómo funciona?</h2>
            <p className="text-xl text-gray-600">Un proceso simple de 4 pasos para dominar cualquier tema.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4 p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div>
                  <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Paso {step.number}</span>
                  <h3 className="text-xl font-bold text-gray-900 mt-1 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Características</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">
              Todo lo que necesitas para aprender mejor
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Testimonios</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">Lo que dicen nuestros estudiantes</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                <div className="flex space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center">
            <span className="text-4xl mb-4 block">🎓</span>
            <h2 className="text-3xl font-bold text-white mb-4">¿Listo para aprender mejor?</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Únete a miles de estudiantes que ya usan Mentorify para dominar sus materias.
            </p>
            <button
              onClick={handleComenzar}
              className="bg-white text-gray-900 px-8 py-4 rounded-full font-medium hover:bg-gray-100 transition-colors inline-flex items-center space-x-2"
            >
              <span>Comenzar gratis</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">Mentorify</span>
            </div>
            
            <p className="text-gray-500 text-sm">
              © 2025 Mentorify. Todos los derechos reservados.
            </p>
            
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">Privacidad</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">Términos</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">Contacto</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
