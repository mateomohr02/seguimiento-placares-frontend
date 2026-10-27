// Proxy del guardado de una planilla (el navegador solo habla con el frontend). El
// formulario lo usa para el guardado automático del borrador y para cerrar o corregir.
// La planilla es de una estación de trabajo + tipo (LIJADO, ENCOLADO, PVC) + día.
import { proxyJson } from "@/lib/api/proxy-json";

type Ctx = RouteContext<"/planillas-api/dia/[estacionTrabajoId]/[planilla]/[fecha]">;

const ruta = async (ctx: Ctx) => {
  const { estacionTrabajoId, planilla, fecha } = await ctx.params;
  return `/planillas/dia/${encodeURIComponent(estacionTrabajoId)}/${encodeURIComponent(planilla)}/${encodeURIComponent(fecha)}`;
};

export async function GET(_req: Request, ctx: Ctx) {
  return proxyJson(await ruta(ctx), { method: "GET" });
}

export async function PUT(req: Request, ctx: Ctx) {
  return proxyJson(await ruta(ctx), { method: "PUT", body: await req.text() });
}
