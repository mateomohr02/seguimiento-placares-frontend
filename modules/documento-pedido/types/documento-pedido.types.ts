export type TipoDocumento =
  | "NOTA_PEDIDO"
  | "DETALLE_REMISION"
  | "ESCANDALLO_PLACARES"
  | "HERRAJES_PLACARES"
  | "ACCESORIOS_PLACARES"
  | "HERRAJES_COCINAS"
  | "ACCESORIOS_COCINAS";

export interface DocumentoPedido {
  id: string;
  pedido_id: string;
  tipo: TipoDocumento;
  nombre: string;
  nombre_archivo: string;
  tamano: number;
  creado_en: string;
}

// Obligatorios en todo pedido; el resto depende de la modulación / modelos
// elegidos. Herrajes y accesorios salen de reportes distintos según la línea
// (placares / cocinas), por eso son tipos separados.
export const TIPOS_OBLIGATORIOS: TipoDocumento[] = ["NOTA_PEDIDO", "DETALLE_REMISION"];

export const TIPOS_ADICIONALES: TipoDocumento[] = [
  "ESCANDALLO_PLACARES",
  "HERRAJES_PLACARES",
  "ACCESORIOS_PLACARES",
  "HERRAJES_COCINAS",
  "ACCESORIOS_COCINAS",
];

export const ETIQUETA_TIPO: Record<TipoDocumento, string> = {
  NOTA_PEDIDO: "Nota de Pedido",
  DETALLE_REMISION: "Detalle de Remisión",
  ESCANDALLO_PLACARES: "Listado de Escandallo de Placares",
  HERRAJES_PLACARES: "Listado de Herrajes de Producción (Placares)",
  ACCESORIOS_PLACARES: "Listado de Accesorios de Instalación (Placares)",
  HERRAJES_COCINAS: "Listado de Herrajes de Producción (Cocinas)",
  ACCESORIOS_COCINAS: "Listado de Accesorios de Instalación (Cocinas)",
};
