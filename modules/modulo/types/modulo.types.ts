import type { Linea } from "@/lib/linea";

export type ModuloEstado = "PENDIENTE" | "EN_PRODUCCION" | "FINALIZADO" | "ELIMINADO";

export interface Modulo {
  id: string;
  idEscena: number;
  descripcion: string;
  estado: ModuloEstado;
  linea: Linea;
  despieceTiposCount: number;
}

export interface ModuloConContexto extends Modulo {
  pedido: { id: string; codigo_pedido: string; nombreComercial: string };
  orden: { id: string; numeroOrdenCustom: string };
}
