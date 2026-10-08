import { loadPdfjs } from "@/lib/pdfjs";
import type { TipoDocumento } from "../types/documento-pedido.types";

export interface AnalisisPdf {
  /** Códigos de pedido (NN-NNNNN) que aparecen en la primera hoja. */
  pedidos: string[];
  /** Tipo de documento deducido del título impreso por TeoWin, si se reconoce. */
  tipo: TipoDocumento | null;
}

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ");

// Deduce el tipo a partir del título del reporte (ej. "LISTADO DE HERRAJES DE
// PRODUCCIÓN PARA PLACARES", "LISTADO DE HERRAJES PRODUCCIÓN DE COCINAS").
export function tipoDesdeTexto(texto: string): TipoDocumento | null {
  const t = normalizar(texto);
  const linea = t.includes("COCINA") ? "COCINAS" : t.includes("PLACAR") ? "PLACARES" : null;
  if (t.includes("NOTA DE PEDIDO")) return "NOTA_PEDIDO";
  if (t.includes("DETALLE DE REMISION")) return "DETALLE_REMISION";
  if (t.includes("ESCANDALLO")) return "ESCANDALLO_PLACARES";
  if (t.includes("HERRAJES") && linea) return linea === "PLACARES" ? "HERRAJES_PLACARES" : "HERRAJES_COCINAS";
  if (t.includes("ACCESORIOS") && linea) return linea === "PLACARES" ? "ACCESORIOS_PLACARES" : "ACCESORIOS_COCINAS";
  return null;
}

// Lee el texto de la primera hoja (los PDFs de TeoWin tienen capa de texto).
// Si el PDF es un escaneo sin texto devuelve un análisis vacío: no se puede verificar.
export async function analizarPdf(file: File): Promise<AnalisisPdf> {
  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    const doc = await loadingTask.promise;
    const page = await doc.getPage(1);
    const { items } = await page.getTextContent();
    const texto = items.map((i) => ("str" in i ? i.str : "")).join(" ");
    const pedidos = [...new Set(texto.match(/\b\d{2}-\d{5}\b/g) ?? [])];
    return { pedidos, tipo: tipoDesdeTexto(texto.slice(0, 1500)) };
  } finally {
    void loadingTask.destroy();
  }
}
