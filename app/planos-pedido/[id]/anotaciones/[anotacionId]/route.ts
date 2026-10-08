import { proxyJson } from "@/lib/api/proxy-json";

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/planos-pedido/[id]/anotaciones/[anotacionId]">,
) {
  const { id, anotacionId } = await ctx.params;
  return proxyJson(
    `/planos-pedido/${encodeURIComponent(id)}/anotaciones/${encodeURIComponent(anotacionId)}`,
    { method: "DELETE" },
  );
}
