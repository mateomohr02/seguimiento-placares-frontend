export type PedidoEstado = "PENDIENTE" | "EN_PRODUCCION" | "FINALIZADO" | "ELIMINADO";

export interface Pedido {
  id: string;
  codigo_pedido: string;
  referencia: string;
  nombreComercial: string;
  estado: PedidoEstado;
  modulosCount: number;
}

export interface PedidoConOrden extends Pedido {
  orden: { id: string; numeroOrdenCustom: string; descripcion: string };
}
