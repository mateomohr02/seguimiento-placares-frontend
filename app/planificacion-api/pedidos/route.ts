import { proxyJson } from "@/lib/api/proxy-json";

// Pedidos ya cargados para elegir en el diálogo de una fila (búsqueda por N° de pedido; requiere documentacion.gestionar).
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return proxyJson(`/planificacion/pedidos?q=${encodeURIComponent(q)}&limit=20`, { method: "GET" });
}
