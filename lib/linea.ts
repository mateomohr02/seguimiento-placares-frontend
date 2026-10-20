// Línea de producto. Estructuralmente igual a LineaPedido (documento-pedido).
export type Linea = "PLACARES" | "COCINAS";

export const LINEAS: Linea[] = ["PLACARES", "COCINAS"];

export const LINEA_LABEL: Record<Linea, string> = {
  PLACARES: "Placares",
  COCINAS: "Cocinas",
};

/** Valida el query param `?linea=`; cualquier otro valor equivale a "todas". */
export function parseLinea(v: string | undefined): Linea | undefined {
  return LINEAS.find((l) => l === v);
}
