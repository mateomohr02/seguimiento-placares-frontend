import { proxyJson } from "@/lib/api/proxy-json";

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/hojas-corte/[id]/anotaciones/[anotacionId]">,
) {
  const { id, anotacionId } = await ctx.params;
  return proxyJson(
    `/hojas-corte/${encodeURIComponent(id)}/anotaciones/${encodeURIComponent(anotacionId)}`,
    { method: "DELETE" },
  );
}
