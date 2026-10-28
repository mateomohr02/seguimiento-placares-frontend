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
// PRODUCCIÓN PARA PLACARES", "LISTADO DE ACCESORIOS DE INSTALACIÓN DE COCINAS").
// Se toma el título que aparece primero en el texto (no importa que otro aparezca
// más abajo) y la línea (cocinas / placares) se busca junto a ese título, no en
// toda la hoja: un cliente o una observación que diga "cocina" no cambia el tipo.
// Si la línea es ambigua devuelve null (no se puede verificar, no se bloquea).
export function tipoDesdeTexto(texto: string): TipoDocumento | null {
  const t = normalizar(texto);
  const candidatos = (["NOTA DE PEDIDO", "DETALLE DE REMISION", "ESCANDALLO", "HERRAJES", "ACCESORIOS"] as const)
    .map((clave) => ({ clave, i: t.indexOf(clave) }))
    .filter((c) => c.i >= 0)
    .sort((a, b) => a.i - b.i);
  const primero = candidatos[0];
  if (!primero) return null;
  switch (primero.clave) {
    case "NOTA DE PEDIDO":
      return "NOTA_PEDIDO";
    case "DETALLE DE REMISION":
      return "DETALLE_REMISION";
    case "ESCANDALLO":
      return "ESCANDALLO_PLACARES"; // el escandallo es solo de placares
  }
  // La mención más cercana al título (hasta 90 caracteres después); si no hay,
  // vale la de toda la hoja solo cuando es inequívoca.
  const cerca = /COCINA|PLACAR/.exec(t.slice(Math.max(0, primero.i - 30), primero.i + 90));
  const linea = cerca ? (cerca[0] === "COCINA" ? "COCINAS" : "PLACARES") : lineaEn(t);
  if (!linea) return null;
  const placares = linea === "PLACARES";
  return primero.clave === "HERRAJES"
    ? placares ? "HERRAJES_PLACARES" : "HERRAJES_COCINAS"
    : placares ? "ACCESORIOS_PLACARES" : "ACCESORIOS_COCINAS";
}

// Línea mencionada en un texto; null si no aparece ninguna o aparecen ambas.
function lineaEn(t: string): "PLACARES" | "COCINAS" | null {
  const c = t.includes("COCINA");
  const p = t.includes("PLACAR");
  return c === p ? null : c ? "COCINAS" : "PLACARES";
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
