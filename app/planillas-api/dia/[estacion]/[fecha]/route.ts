// Proxy del guardado de una planilla (el navegador solo habla con el frontend). El
// formulario lo usa para el guardado automático del borrador y para cerrar o corregir.
import { proxyJson } from "@/lib/api/proxy-json";

export async function GET(_req: Request, ctx: RouteContext<"/planillas-api/dia/[estacion]/[fecha]">) {
  const { estacion, fecha } = await ctx.params;
  return proxyJson(`/planillas/dia/${encodeURIComponent(estacion)}/${encodeURIComponent(fecha)}`, { method: "GET" });
}

export async function PUT(req: Request, ctx: RouteContext<"/planillas-api/dia/[estacion]/[fecha]">) {
  const { estacion, fecha } = await ctx.params;
  return proxyJson(`/planillas/dia/${encodeURIComponent(estacion)}/${encodeURIComponent(fecha)}`, {
    method: "PUT",
    body: await req.text(),
  });
}
