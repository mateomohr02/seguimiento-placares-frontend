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
}

export interface ParedEscena {
  lado: "int" | "ext";
  p: [number, number, number][];
  /** Material decorativo de la cara (ej. papel pintado). */
  m?: string;
}

export interface ModuloEscena {
  idEscena: number;
  nombre: string;
  familia: string;
  /** Catálogo del mueble (4 = Placares, 3 = Cocinas). */
  catalogo: string;
  dim: [number, number, number];
}

/** Grupo de piezas que se desplazan juntas: un cajón que se abre o una hoja corrediza. */
export interface AnimacionEscena {
  tipo: "cajon" | "puerta";
  mod: number | null;
  eje: [number, number, number];
  /** Recorrido de apertura en mm. */
  dist: number;
}

/** Geometría ya interpretada por el backend (mm; X ancho, Y alto, Z profundidad). */
export interface Escena3D {
  version: number;
  cabecera: { pedido: string | null; version3d: string | null };
  modulos: ModuloEscena[];
  cajas: CajaEscena[];
  paredes: ParedEscena[];
  animaciones: AnimacionEscena[];
  materialSuelo: string | null;
  /** Materiales usados como "catálogo/código" (para pedir sus texturas). */
  materiales: string[];
  suelo: [number, number][];
  sinResolver: string[];
}

export interface EscenaConNombre {
  nombre: string;
  escena: Escena3D;
}
