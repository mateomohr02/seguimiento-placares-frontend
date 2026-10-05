// Coordenadas normalizadas: 0..1 sobre el ancho (x) y el alto (y) de la página.
// `grosor` y `tamano` son fracción del ancho de la página. Mismo contrato que
// el backend (hojas-corte/schemas/anotacion.schema.ts).
export interface DatosDibujo {
  puntos: [number, number][];
  grosor: number;
  color: string;
  resaltador: boolean;
}

export interface DatosTexto {
  x: number;
  y: number;
  texto: string;
  tamano: number;
  color: string;
}

export interface DatosNota {
  texto: string;
}

export type NuevaAnotacion =
  | { tipo: "DIBUJO"; pagina: number; datos: DatosDibujo }
  | { tipo: "TEXTO"; pagina: number; datos: DatosTexto }
  | { tipo: "TEXTO"; pagina: null; datos: DatosNota };

export type Anotacion = NuevaAnotacion & { id: string; creado_en: string };

export type Herramienta = "mover" | "lapiz" | "resaltador" | "texto" | "borrador";

export type AnotacionPagina = Extract<Anotacion, { pagina: number }>;
export type AnotacionNota = Extract<Anotacion, { pagina: null }>;
