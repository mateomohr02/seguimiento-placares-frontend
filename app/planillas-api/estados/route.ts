import { proxyJson } from "@/lib/api/proxy-json";

// Catálogo de estados de producción (lo define técnica).
export async function PUT(req: Request) {
  return proxyJson("/planillas/estados", { method: "PUT", body: await req.text() });
}
