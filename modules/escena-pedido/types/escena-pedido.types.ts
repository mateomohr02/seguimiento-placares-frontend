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
}

export interface ParedEscena {
  lado: "int" | "ext";
  p: [number, number, number][];
}

export interface ModuloEscena {
  idEscena: number;
  nombre: string;
  familia: string;
  dim: [number, number, number];
}

/** Geometría ya interpretada por el backend (mm; X ancho, Y alto, Z profundidad). */
export interface Escena3D {
  version: number;
  cabecera: { pedido: string | null; version3d: string | null };
  modulos: ModuloEscena[];
  cajas: CajaEscena[];
  paredes: ParedEscena[];
  suelo: [number, number][];
  sinResolver: string[];
}

export interface EscenaConNombre {
  nombre: string;
  escena: Escena3D;
}
