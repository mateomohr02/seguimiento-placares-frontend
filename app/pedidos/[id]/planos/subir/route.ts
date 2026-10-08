// Recibe el archivo crudo (imagen o PDF) desde el navegador y lo reenvía al
// backend conservando su Content-Type. Route Handler (no Server Action) porque
// los Server Actions limitan el body a 1 MB.
import { authHeaders } from "@/lib/auth/sesion";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

export async function POST(req: Request, ctx: RouteContext<"/pedidos/[id]/planos/subir">) {
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const query = new URLSearchParams({
    nombre: searchParams.get("nombre") ?? "",
    archivo: searchParams.get("archivo") ?? "",
  });
  const moduloId = searchParams.get("moduloId");
  if (moduloId) query.set("moduloId", moduloId);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/pedidos/${encodeURIComponent(id)}/planos?${query}`, {
      method: "POST",
      headers: { "Content-Type": req.headers.get("content-type") ?? "application/octet-stream", ...(await authHeaders()) },
      body: await req.arrayBuffer(),
      cache: "no-store",
    });
  } catch {
    return Response.json({ message: "No se pudo comunicar con el servidor." }, { status: 502 });
  }
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  return Response.json({ message: body?.message ?? null }, { status: res.status });
}
