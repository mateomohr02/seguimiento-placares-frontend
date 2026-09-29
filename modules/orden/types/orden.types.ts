export type OrdenEstado = "PENDIENTE" | "EN_PROCESO" | "LISTA" | "ELIMINADO";

export interface Orden {
  id: string;
  codigoOrdenFabricacion: number;
  numeroOrdenCustom: string;
  descripcion: string;
  estado: OrdenEstado;
  creado_en: string;
  pedidosCount: number;
}
