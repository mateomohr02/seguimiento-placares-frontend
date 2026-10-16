// Escenas 3D de un pedido (.3d de TeoWin), solo lectura — diseño.md §13.
export interface EscenaPedido {
  id: string;
  pedido_id: string;
  nombre: string;
  nombre_archivo: string;
  tamano: number;
  creado_en: string;
}

export interface CajaEscena {
  mod: number | null;
  m: string;
  c: [number, number, number] | null;
  t: [number, number, number];
  r: number[];
  s: [number, number, number];
  /** Índice en `animaciones` si la pieza se mueve con un cajón o una hoja corrediza. */
  a?: number;
  /** Opacidad de una pieza translúcida (vidrio); sin dato = opaca. */
  o?: number;
  /** Catálogo de la pieza si no es el 4 (ej. 658 = puertas): dónde buscar su textura. */
  k?: string;
}

/** Malla de triángulos (cortinas, barandas, tubos…). */
export interface MallaEscena {
  mod: number | null;
  m: string;
  c: [number, number, number] | null;
  t: [number, number, number];
  r: number[];
  /** Vértices x,y,z consecutivos. */
  v: number[];
  /** Triángulos: 3 índices por cara. */
  i: number[];
  /** Coordenadas de textura u,v por vértice. */
  uv?: number[];
  a?: number;
  o?: number;
  k?: string;
  /** Sin iluminación (fotos de paisaje). */
  e?: 1;
}

export interface ParedEscena {
  lado: "int" | "ext";
  p: [number, number, number][];
  /** Material decorativo de la cara (ej. papel pintado). */
  m?: string;
  /** Medida (mm) de la baldosa del revestimiento: la textura entera cubre una baldosa. */
  t?: [number, number];
  /** Huecos de la cara (puertas de paso): [x0, y0, x1, y1] en mm sobre la cara. */
  h?: [number, number, number, number][];
}

export interface ModuloEscena {
  idEscena: number;
  nombre: string;
  familia: string;
  /** Catálogo del mueble (4 = Placares, 3 = Cocinas). */
  catalogo: string;
  /** Hacia dónde mira el frente del mueble en la escena (vector unitario). */
  frente: [number, number, number];
  dim: [number, number, number];
}

/** Grupo de piezas que se desplazan juntas: un cajón que se abre o una hoja corrediza. */
export interface AnimacionEscena {
  tipo: "cajon" | "puerta" | "giro";
  mod: number | null;
  /** Dirección del desplazamiento o, en `giro`, eje de la bisagra. */
  eje: [number, number, number];
  /** Punto del eje de la bisagra (solo `giro`). */
  pivote?: [number, number, number];
  /** Recorrido de apertura en mm (en `giro`: ángulo en grados). */
  dist: number;
}

/** Geometría ya interpretada por el backend (mm; X ancho, Y alto, Z profundidad). */
export interface Escena3D {
  version: number;
  cabecera: { pedido: string | null; version3d: string | null };
  modulos: ModuloEscena[];
  cajas: CajaEscena[];
  /** Mallas de triángulos (escenas interpretadas con la versión 15 o posterior). */
  mallas?: MallaEscena[];
  paredes: ParedEscena[];
  animaciones: AnimacionEscena[];
  materialSuelo: string | null;
  /** Medida (mm) de la baldosa del piso (escenas interpretadas con la versión 11 o posterior). */
  sueloTile?: [number, number] | null;
  /** Materiales usados como "catálogo/código" (para pedir sus texturas). */
  materiales: string[];
  suelo: [number, number][];
  sinResolver: string[];
}

export interface EscenaConNombre {
  nombre: string;
  escena: Escena3D;
}
