import { proxyJson } from "@/lib/api/proxy-json";

// Carga la planificación importada (técnica): { semana, sin_pedido, hojas: [{ plantilla, modo, filas }] }. El servidor revalida todo y
// lo escribe en una sola transacción.
export async function POST(req: Request) {
  return proxyJson("/planificacion/importar/confirmar", { method: "POST", body: await req.text() });
}
