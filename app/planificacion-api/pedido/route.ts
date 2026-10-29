import { proxyJson } from "@/lib/api/proxy-json";

// Valida un N° TW tipeado en el diálogo de fila: devuelve el pedido con ese código exacto o null (requiere documentacion.gestionar).
export async function GET(req: Request) {
  const nTw = new URL(req.url).searchParams.get("n_tw") ?? "";
  return proxyJson(`/planificacion/pedido?n_tw=${encodeURIComponent(nTw)}`, { method: "GET" });
}
