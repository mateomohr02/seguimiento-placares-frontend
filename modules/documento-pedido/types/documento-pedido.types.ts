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

/** Línea de producto de un pedido (un pedido puede ser mixto: placares y cocinas). */
export type LineaPedido = "PLACARES" | "COCINAS";

// Documentación adicional por línea. Cocinas no tiene escandallo (decisión del
// usuario): solo herrajes de producción y accesorios de instalación.
export const TIPOS_ADICIONALES_POR_LINEA: Record<LineaPedido, TipoDocumento[]> = {
  PLACARES: ["ESCANDALLO_PLACARES", "HERRAJES_PLACARES", "ACCESORIOS_PLACARES"],
  COCINAS: ["HERRAJES_COCINAS", "ACCESORIOS_COCINAS"],
};

export const TIPOS_ADICIONALES: TipoDocumento[] = [
  ...TIPOS_ADICIONALES_POR_LINEA.PLACARES,
  ...TIPOS_ADICIONALES_POR_LINEA.COCINAS,
];

/** Tipos adicionales que corresponden a las líneas del pedido. Si el backend aún
 *  no informa las líneas (o vienen vacías) se asume ["PLACARES"]. */
export function tiposAdicionalesDe(lineas?: LineaPedido[] | null): TipoDocumento[] {
  const efectivas: LineaPedido[] = lineas && lineas.length > 0 ? lineas : ["PLACARES"];
  return TIPOS_ADICIONALES.filter((t) => efectivas.some((l) => TIPOS_ADICIONALES_POR_LINEA[l].includes(t)));
}

export const ETIQUETA_TIPO: Record<TipoDocumento, string> = {
  NOTA_PEDIDO: "Nota de Pedido",
  DETALLE_REMISION: "Detalle de Remisión",
  ESCANDALLO_PLACARES: "Listado de Escandallo de Placares",
  HERRAJES_PLACARES: "Listado de Herrajes de Producción (Placares)",
  ACCESORIOS_PLACARES: "Listado de Accesorios de Instalación (Placares)",
  HERRAJES_COCINAS: "Listado de Herrajes de Producción (Cocinas)",
  ACCESORIOS_COCINAS: "Listado de Accesorios de Instalación (Cocinas)",
};
