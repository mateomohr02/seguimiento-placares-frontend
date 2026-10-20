import { proxyJson } from "@/lib/api/proxy-json";

// Qué planillas completa un usuario (lo configura técnica).
export async function PUT(req: Request, ctx: RouteContext<"/planillas-api/accesos/[usuarioId]">) {
  const { usuarioId } = await ctx.params;
  return proxyJson(`/planillas/accesos/${encodeURIComponent(usuarioId)}`, { method: "PUT", body: await req.text() });
}
