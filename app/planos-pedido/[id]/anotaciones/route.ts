import { proxyJson } from "@/lib/api/proxy-json";

export async function GET(_req: Request, ctx: RouteContext<"/planos-pedido/[id]/anotaciones">) {
  const { id } = await ctx.params;
  return proxyJson(`/planos-pedido/${encodeURIComponent(id)}/anotaciones`, { method: "GET" });
}

export async function POST(req: Request, ctx: RouteContext<"/planos-pedido/[id]/anotaciones">) {
  const { id } = await ctx.params;
  return proxyJson(`/planos-pedido/${encodeURIComponent(id)}/anotaciones`, {
    method: "POST",
    body: await req.text(),
  });
}
