// Recibe la foto cruda desde el navegador y la reenvía al backend. Route Handler (no
// Server Action) porque los Server Actions limitan el body a 1 MB.
import { authHeaders } from "@/lib/auth/sesion";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

export async function POST(req: Request, ctx: RouteContext<"/planillas-api/filas/[filaId]/fotos">) {
  const { filaId } = await ctx.params;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/planillas/filas/${encodeURIComponent(filaId)}/fotos`, {
      method: "POST",
      headers: { "Content-Type": req.headers.get("content-type") ?? "image/jpeg", ...(await authHeaders()) },
      body: await req.arrayBuffer(),
      cache: "no-store",
    });
  } catch {
    return Response.json({ message: "No se pudo comunicar con el servidor." }, { status: 502 });
  }
  const body = await res.json().catch(() => null);
  return Response.json(body ?? { message: "Respuesta inválida del servidor." }, { status: res.status });
}
