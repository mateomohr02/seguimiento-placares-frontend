import { proxyJson } from "@/lib/api/proxy-json";

// Buscador por N° de pedido dentro de la planificación de una estación: devuelve en qué semana está cada fila.
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  return proxyJson(`/planificacion/buscar?estacion=${encodeURIComponent(p.get("estacion") ?? "")}&q=${encodeURIComponent(p.get("q") ?? "")}`, { method: "GET" });
}
