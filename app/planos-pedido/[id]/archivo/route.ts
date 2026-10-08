// Proxy del archivo de un plano (imagen o PDF). El navegador solo habla con el
// frontend; ver app/hojas-corte/[id]/archivo/route.ts.
import { authHeaders } from "@/lib/auth/sesion";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

export async function GET(_req: Request, ctx: RouteContext<"/planos-pedido/[id]/archivo">) {
  const { id } = await ctx.params;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/planos-pedido/${encodeURIComponent(id)}/archivo`, { cache: "no-store", headers: await authHeaders() });
  } catch {
    return Response.json({ message: "No se pudo comunicar con el servidor." }, { status: 502 });
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    return Response.json({ message: body?.message ?? "No se pudo obtener el plano." }, { status: res.status });
  }
  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Length": res.headers.get("Content-Length") ?? "",
      "Content-Disposition": res.headers.get("Content-Disposition") ?? "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=300",
    },
  });
}
