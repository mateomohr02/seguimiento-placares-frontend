import type { Linea } from "@/lib/linea";

export type ModuloEstado = "PENDIENTE" | "EN_PRODUCCION" | "FINALIZADO" | "ELIMINADO";

/**
 * «Partida» de TeoWin: el detalle del presupuesto del módulo. `variantes`, `precio` y `total` solo los entrega el backend a los
 * roles de gestión; para fábrica vienen `undefined` (la UI no debe insinuar que existen).
 */
export interface Partida {
  unidades: number;
  referencia: string;
  /** Primera línea de la descripción (ej. «BAJO CIRO 2 PUERTAS»). */
  titulo: string | null;
  /** Multilínea (separada por saltos de línea), ya normalizada. */
  descripcion: string;
  largo: number | null;
  alto: number | null;
  profundidad: number | null;
  capitulo: string | null;
  /** Importe de variantes (precioVariantes de TeoWin); solo roles de gestión, como precio y total. */
  variantes?: number | null;
  precio?: number | null;
  total?: number | null;
}

export interface Modulo {
  id: string;
  idEscena: number;
  descripcion: string;
  estado: ModuloEstado;
  linea: Linea;
  despieceTiposCount: number;
  /** null si el módulo no tiene partida cargada (o el backend todavía no la entrega). */
  partida: Partida | null;
}

export interface ModuloConContexto extends Modulo {
  pedido: { id: string; codigo_pedido: string; nombreComercial: string };
  orden: { id: string; numeroOrdenCustom: string };
}
