import { proxyJson } from "@/lib/api/proxy-json";

// Buscador por N° TW dentro de una planificación: devuelve en qué semana (y día, en Calidad) está cada fila.
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  return proxyJson(`/planificacion/buscar?plantilla=${encodeURIComponent(p.get("plantilla") ?? "")}&q=${encodeURIComponent(p.get("q") ?? "")}`, { method: "GET" });
}
