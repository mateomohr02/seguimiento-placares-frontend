// Carga perezosa de pdf.js (solo en el cliente: toca DOM al importarse, no se
// puede evaluar en SSR). Se usa la build "legacy" a propósito: corre en
// navegadores de tablets viejas, donde la build moderna falla en silencio.
export type PdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let cached: Promise<PdfJs> | null = null;

export function loadPdfjs(): Promise<PdfJs> {
  cached ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    return pdfjs;
  });
  return cached;
}
