export type PiezaEstado = "PENDIENTE" | "CORTADA" | "ELIMINADA";

export interface Pieza {
  id: string;
  idUnico: number | null;
  familia: string;
  articulo: string;
  color: string;
  descripcion: string | null;
  medida1: string;
  medida2: string;
  estado: PiezaEstado;
  escaneado_en: string | null;
}

export interface EscaneoResumen {
  yaEscaneada: boolean;
  pieza: {
    id: string;
    idUnico: number | null;
    familia: string;
    articulo: string;
    color: string;
    descripcion: string | null;
    medida1: string;
    medida2: string;
  };
  modulo: { id: string; idEscena: number; descripcion: string };
  pedido: { id: string; codigo_pedido: string; referencia: string };
  orden: { id: string; numeroOrdenCustom: string };
}
