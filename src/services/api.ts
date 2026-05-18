/**
 * Servicio de API para Mentorify
 * Conecta el frontend con el backend FastAPI
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface Ejercicio {
  id: number;
  titulo: string;
  enunciado: string;
  dominio: string;
  nivel_dificultad: string;
  conceptos_clave: string[];
}

export interface Mensaje {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface InteraccionResponse {
  respuesta: string;
  accion_tomada: string;
  estado_estudiante: string;
  pistas_entregadas: number;
  errores_consecutivos: number;
}

export interface SesionResponse {
  sesion_id: number;
  ejercicio_enunciado: string;
  mensaje_bienvenida: string;
  ejercicio: Ejercicio;
}

/**
 * Iniciar una nueva sesión de tutoría
 */
export async function iniciarSesion(ejercicioId: number, estudianteId: string): Promise<SesionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/sesion/iniciar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ejercicio_id: ejercicioId,
        estudiante_id: estudianteId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error ${response.status}: ${error}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    throw error;
  }
}

/**
 * Enviar interacción al mentor
 */
export async function interactuar(
  sesionId: number, 
  textoEstudiante: string
): Promise<InteraccionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/sesion/interactuar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sesion_id: sesionId,
        texto_estudiante: textoEstudiante,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error ${response.status}: ${error}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error al enviar interacción:', error);
    throw error;
  }
}

/**
 * Obtener lista de ejercicios
 */
export async function obtenerEjercicios(dominio?: string, nivel?: string): Promise<Ejercicio[]> {
  try {
    const params = new URLSearchParams();
    if (dominio) params.append('dominio', dominio);
    if (nivel) params.append('nivel', nivel);

    const url = `${API_BASE_URL}/ejercicios${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error al obtener ejercicios:', error);
    throw error;
  }
}

/**
 * Verificar intento final del estudiante
 */
export async function verificarIntento(sesionId: number, intentoFinal: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/sesion/verificar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sesion_id: sesionId,
        intento_final: intentoFinal,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error al verificar intento:', error);
    throw error;
  }
}

/**
 * Obtener progreso del estudiante
 */
export async function obtenerProgreso(estudianteId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/progreso/${estudianteId}`);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error al obtener progreso:', error);
    throw error;
  }
}

/**
 * Obtener métricas del sistema
 */
export async function obtenerMetricas() {
  try {
    const response = await fetch(`${API_BASE_URL}/metricas`);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error al obtener métricas:', error);
    throw error;
  }
}

/**
 * Verificar salud del sistema
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Error en health check:', error);
    return false;
  }
}
