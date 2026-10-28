import type { Linea } from "@/lib/linea";

export type OrdenEstado = "PENDIENTE" | "EN_PROCESO" | "LISTA" | "ELIMINADO";

export interface Orden {
  id: string;
  codigoOrdenFabricacion: number;
  numeroOrdenCustom: string;
  descripcion: string;
  estado: OrdenEstado;
  lineas: Linea[];
  creado_en: string;
  archivada_en: string | null;
  pedidosCount: number;
  codigosPedido: string[];
}
