import { proxyJson } from "@/lib/api/proxy-json";

// Drag and drop de la cartera de órdenes: { ids } con las órdenes visibles en el nuevo orden.
export async function PUT(req: Request) {
  return proxyJson("/ordenes/reordenar", { method: "PUT", body: await req.text() });
}
