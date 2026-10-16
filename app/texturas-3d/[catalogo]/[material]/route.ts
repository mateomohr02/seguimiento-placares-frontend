// Proxy de las texturas de materiales de las escenas 3D (por catálogo). El navegador solo habla
// con el frontend, que reenvía al backend con el token de la sesión.
import { authHeaders } from "@/lib/auth/sesion";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

export async function GET(_req: Request, ctx: RouteContext<"/texturas-3d/[catalogo]/[material]">) {
  const { catalogo, material } = await ctx.params;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/texturas-3d/${encodeURIComponent(catalogo)}/${encodeURIComponent(material)}`, {
      cache: "no-store",
      headers: await authHeaders(),
    });
  } catch {
    return Response.json({ message: "No se pudo comunicar con el servidor." }, { status: 502 });
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    return Response.json({ message: body?.message ?? "No se pudo obtener la textura." }, { status: res.status });
  }
  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
      "Content-Length": res.headers.get("Content-Length") ?? "",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
