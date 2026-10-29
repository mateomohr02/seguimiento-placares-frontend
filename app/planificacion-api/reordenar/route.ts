import { proxyJson } from "@/lib/api/proxy-json";

// Drag and drop de filas de la planificación (técnica): { plantilla, semana, dia?, ids }.
export async function PUT(req: Request) {
  return proxyJson("/planificacion/reordenar", { method: "PUT", body: await req.text() });
}
