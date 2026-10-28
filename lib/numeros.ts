// Formato numérico es-AR compartido por la UI (montos y medidas).
const MONTO = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MEDIDA = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1, useGrouping: false });

/** 356798.6 -> "356.798,60". */
export function formatoMonto(n: number): string {
  return MONTO.format(n);
}

/** Medida en mm sin separador de miles (como TeoWin): 1000 -> "1000"; null -> "—". */
export function formatoMedida(n: number | null | undefined): string {
  return n == null ? "—" : MEDIDA.format(n);
}
