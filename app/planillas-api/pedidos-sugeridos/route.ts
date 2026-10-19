import { proxyJson } from "@/lib/api/proxy-json";

// Sugerencias de N° de pedido mientras se escribe (pedidos sincronizados y ya cargados).
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return proxyJson(`/planillas/pedidos-sugeridos?q=${encodeURIComponent(q)}`, { method: "GET" });
}
