import { proxyJson } from "@/lib/api/proxy-json";

export async function GET(_req: Request, ctx: RouteContext<"/documentos-pedido/[id]/anotaciones">) {
  const { id } = await ctx.params;
  return proxyJson(`/documentos-pedido/${encodeURIComponent(id)}/anotaciones`, { method: "GET" });
}

export async function POST(req: Request, ctx: RouteContext<"/documentos-pedido/[id]/anotaciones">) {
  const { id } = await ctx.params;
  return proxyJson(`/documentos-pedido/${encodeURIComponent(id)}/anotaciones`, {
    method: "POST",
    body: await req.text(),
  });
}
