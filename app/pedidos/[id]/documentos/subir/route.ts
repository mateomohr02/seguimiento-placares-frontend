// Recibe el PDF crudo desde el navegador y lo reenvía al backend. Route Handler
// (no Server Action) porque los Server Actions limitan el body a 1 MB.
import { authHeaders } from "@/lib/auth/sesion";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

export async function POST(req: Request, ctx: RouteContext<"/pedidos/[id]/documentos/subir">) {
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const query = new URLSearchParams({
    tipo: searchParams.get("tipo") ?? "",
    nombre: searchParams.get("nombre") ?? "",
    archivo: searchParams.get("archivo") ?? "",
  });
  if (!query.get("nombre")) query.delete("nombre");

  let res: Response;
  try {
    res = await fetch(`${API_URL}/pedidos/${encodeURIComponent(id)}/documentos?${query}`, {
      method: "POST",
      headers: { "Content-Type": "application/pdf", ...(await authHeaders()) },
      body: await req.arrayBuffer(),
      cache: "no-store",
    });
  } catch {
    return Response.json({ message: "No se pudo comunicar con el servidor." }, { status: 502 });
  }
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  return Response.json({ message: body?.message ?? null }, { status: res.status });
}
