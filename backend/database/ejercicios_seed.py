"""
Seed de ejercicios iniciales para la base de datos
10 ejercicios en dominios: algoritmos, estructuras de datos, POO, lógica matemática
"""

from sqlalchemy.orm import Session
from backend.database.models import Ejercicio, SessionLocal

def seed_ejercicios():
    """Poblar la base de datos con ejercicios iniciales"""
    db = SessionLocal()
    try:
        # Verificar si ya existen ejercicios
        existing = db.query(Ejercicio).count()
        if existing > 0:
            print(f"Ya existen {existing} ejercicios en la base de datos.")
            return
        
        ejercicios = [
            {
                "titulo": "Búsqueda Binaria en Python",
                "enunciado": "Implementa una función de búsqueda binaria que reciba una lista ordenada y un valor objetivo. La función debe retornar el índice del valor si existe, o -1 si no se encuentra. No uses métodos built-in de búsqueda.",
                "dominio": "algoritmos",
                "nivel_dificultad": "medio",
                "conceptos_clave": ["búsqueda binaria", "divide y vencerás", "complejidad O(log n)", "listas ordenadas"],
                "solucion_referencia": "def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1",
                "criterios_verificacion": {
                    "debe_tener": ["while o for", "comparación de índices", "cálculo del punto medio"],
                    "no_debe_tener": ["arr.index()", "arr.find()"],
                    "complejidad": "O(log n)"
                }
            },
            {
                "titulo": "Complejidad Temporal de Bubble Sort",
                "enunciado": "Analiza el algoritmo Bubble Sort y explica por qué su complejidad temporal es O(n²). Considera el peor caso, mejor caso y caso promedio. ¿Cuántas comparaciones se realizan en total?",
                "dominio": "algoritmos",
                "nivel_dificultad": "basico",
                "conceptos_clave": ["complejidad temporal", "análisis de algoritmos", "notación Big-O", "bucles anidados"],
                "solucion_referencia": "Bubble Sort tiene dos bucles anidados. El externo itera n veces, el interno también aproximadamente n veces en promedio. Total: n × n = n² comparaciones.",
                "criterios_verificacion": {
                    "debe_mencionar": ["bucles anidados", "n²", "comparaciones"],
                    "explicacion": "debe explicar la relación entre bucles y complejidad"
                }
            },
            {
                "titulo": "Lista Enlazada vs Arreglo",
                "enunciado": "Compara las estructuras de datos Lista Enlazada y Arreglo (Array). ¿Cuándo es más eficiente usar una sobre la otra? Considera operaciones de inserción, eliminación y acceso.",
                "dominio": "estructuras de datos",
                "nivel_dificultad": "basico",
                "conceptos_clave": ["lista enlazada", "arreglo", "complejidad de operaciones", "memoria contigua"],
                "solucion_referencia": "Arreglo: acceso O(1), inserción/eliminación O(n). Lista enlazada: acceso O(n), inserción/eliminación O(1) si se tiene la referencia. Arreglo usa memoria contigua, lista usa nodos dispersos.",
                "criterios_verificacion": {
                    "debe_comparar": ["acceso", "inserción", "eliminación"],
                    "debe_mencionar": ["complejidad", "memoria"]
                }
            },
            {
                "titulo": "Recursión: Factorial y Fibonacci",
                "enunciado": "Implementa funciones recursivas para calcular el factorial de un número y la serie de Fibonacci. Explica el caso base y el caso recursivo de cada una. ¿Cuál es la complejidad de cada implementación?",
                "dominio": "algoritmos",
                "nivel_dificultad": "basico",
                "conceptos_clave": ["recursión", "caso base", "caso recursivo", "pila de llamadas"],
                "solucion_referencia": "def factorial(n): return 1 if n <= 1 else n * factorial(n-1)\ndef fib(n): return n if n <= 1 else fib(n-1) + fib(n-2)",
                "criterios_verificacion": {
                    "debe_tener": ["caso base", "llamada recursiva"],
                    "complejidad_factorial": "O(n)",
                    "complejidad_fibonacci": "O(2^n) sin memoización"
                }
            },
            {
                "titulo": "Árbol Binario de Búsqueda: Inserción",
                "enunciado": "Implementa la operación de inserción en un Árbol Binario de Búsqueda (BST). La función debe mantener la propiedad del BST: todos los nodos a la izquierda son menores, todos a la derecha son mayores.",
                "dominio": "estructuras de datos",
                "nivel_dificultad": "medio",
                "conceptos_clave": ["árbol binario", "BST", "inserción", "propiedad de orden"],
                "solucion_referencia": "def insert(root, val):\n    if not root:\n        return TreeNode(val)\n    if val < root.val:\n        root.left = insert(root.left, val)\n    else:\n        root.right = insert(root.right, val)\n    return root",
                "criterios_verificacion": {
                    "debe_tener": ["caso base (nodo None)", "comparación de valores", "recursión o iteración"],
                    "debe_mantener": "propiedad BST"
                }
            },
            {
                "titulo": "Herencia y Polimorfismo en Python",
                "enunciado": "Crea una jerarquía de clases que demuestre herencia y polimorfismo. Define una clase base 'Figura' con un método 'area()', y al menos dos clases hijas que implementen este método de forma diferente.",
                "dominio": "POO",
                "nivel_dificultad": "medio",
                "conceptos_clave": ["herencia", "polimorfismo", "clases", "métodos", "sobrescritura"],
                "solucion_referencia": "class Figura:\n    def area(self): pass\nclass Rectangulo(Figura):\n    def __init__(self, b, h): self.b, self.h = b, h\n    def area(self): return self.b * self.h\nclass Circulo(Figura):\n    def __init__(self, r): self.r = r\n    def area(self): return 3.14 * self.r ** 2",
                "criterios_verificacion": {
                    "debe_tener": ["clase base", "al menos 2 clases hijas", "sobrescritura de método"],
                    "debe_demostrar": "polimorfismo"
                }
            },
            {
                "titulo": "Tabla Hash: Manejo de Colisiones",
                "enunciado": "Explica dos estrategias diferentes para manejar colisiones en una tabla hash: encadenamiento (chaining) y direccionamiento abierto (open addressing). ¿Cuáles son las ventajas y desventajas de cada una?",
                "dominio": "estructuras de datos",
                "nivel_dificultad": "avanzado",
                "conceptos_clave": ["tabla hash", "colisiones", "encadenamiento", "direccionamiento abierto", "función hash"],
                "solucion_referencia": "Encadenamiento: cada bucket es una lista/enlazada. Ventaja: simple, maneja muchas colisiones. Desventaja: usa memoria extra. Direccionamiento abierto: busca otro bucket libre. Ventaja: sin punteros. Desventaja: clustering, más complejo.",
                "criterios_verificacion": {
                    "debe_explicar": ["encadenamiento", "direccionamiento abierto"],
                    "debe_comparar": ["ventajas", "desventajas"]
                }
            },
            {
                "titulo": "Ordenamiento Merge Sort",
                "enunciado": "Implementa el algoritmo Merge Sort. Explica cómo funciona la estrategia 'divide y vencerás' en este contexto. ¿Por qué su complejidad es O(n log n) en todos los casos?",
                "dominio": "algoritmos",
                "nivel_dificultad": "medio",
                "conceptos_clave": ["merge sort", "divide y vencerás", "complejidad O(n log n)", "ordenamiento"],
                "solucion_referencia": "def merge_sort(arr):\n    if len(arr) <= 1: return arr\n    mid = len(arr) // 2\n    left = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    return merge(left, right)",
                "criterios_verificacion": {
                    "debe_tener": ["caso base", "división", "función merge"],
                    "complejidad": "O(n log n)"
                }
            },
            {
                "titulo": "Notación Big-O: Análisis de Loops Anidados",
                "enunciado": "Dado el siguiente código, determina su complejidad temporal:\nfor i in range(n):\n    for j in range(i, n):\n        print(i, j)\nExplica paso a paso cómo llegas a tu conclusión.",
                "dominio": "algoritmos",
                "nivel_dificultad": "basico",
                "conceptos_clave": ["notación Big-O", "loops anidados", "análisis de complejidad", "suma de series"],
                "solucion_referencia": "El loop externo va de 0 a n-1. El interno va de i a n-1. Total iteraciones: n + (n-1) + (n-2) + ... + 1 = n(n+1)/2 = O(n²)",
                "criterios_verificacion": {
                    "debe_llegar_a": "O(n²)",
                    "debe_explicar": "suma de series aritméticas"
                }
            },
            {
                "titulo": "Grafo: BFS vs DFS",
                "enunciado": "Compara los algoritmos de Búsqueda en Anchura (BFS) y Búsqueda en Profundidad (DFS) para recorrer grafos. ¿Cuándo usarías cada uno? Implementa uno de ellos para encontrar el camino más corto en un grafo no ponderado.",
                "dominio": "estructuras de datos",
                "nivel_dificultad": "avanzado",
                "conceptos_clave": ["grafos", "BFS", "DFS", "recorrido", "camino más corto", "cola", "pila"],
                "solucion_referencia": "BFS usa cola (FIFO), encuentra camino más corto en grafos no ponderados. DFS usa pila (LIFO) o recursión, bueno para detectar ciclos y explorar todo el espacio. BFS es óptimo para camino más corto.",
                "criterios_verificacion": {
                    "debe_comparar": ["BFS", "DFS"],
                    "debe_mencionar": ["cola", "pila", "camino más corto"],
                    "caso_uso": "debe explicar cuándo usar cada uno"
                }
            }
        ]
        
        for ej in ejercicios:
            ejercicio = Ejercicio(
                titulo=ej["titulo"],
                enunciado=ej["enunciado"],
                dominio=ej["dominio"],
                nivel_dificultad=ej["nivel_dificultad"],
                conceptos_clave=ej["conceptos_clave"],
                solucion_referencia=ej["solucion_referencia"],
                criterios_verificacion=ej["criterios_verificacion"]
            )
            db.add(ejercicio)
        
        db.commit()
        print(f"Se han creado {len(ejercicios)} ejercicios en la base de datos.")
        
    finally:
        db.close()

if __name__ == "__main__":
    seed_ejercicios()
