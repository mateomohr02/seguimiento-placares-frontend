// Proxy de una foto de planilla (ver y borrar).
import { proxyJson } from "@/lib/api/proxy-json";
import { authHeaders } from "@/lib/auth/sesion";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

export async function GET(_req: Request, ctx: RouteContext<"/planillas-api/fotos/[fotoId]">) {
  const { fotoId } = await ctx.params;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/planillas/fotos/${encodeURIComponent(fotoId)}`, { cache: "no-store", headers: await authHeaders() });
  } catch {
    return Response.json({ message: "No se pudo comunicar con el servidor." }, { status: 502 });
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    return Response.json({ message: body?.message ?? "No se pudo obtener la foto." }, { status: res.status });
  }
  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
      "Content-Length": res.headers.get("Content-Length") ?? "",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=86400",
    },
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/planillas-api/fotos/[fotoId]">) {
  const { fotoId } = await ctx.params;
  return proxyJson(`/planillas/fotos/${encodeURIComponent(fotoId)}`, { method: "DELETE" });
}
