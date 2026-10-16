// Recibe el .3d crudo desde el navegador y lo reenvía al backend. Route Handler (no
// Server Action) porque los Server Actions limitan el body a 1 MB.
import { authHeaders } from "@/lib/auth/sesion";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

export async function POST(req: Request, ctx: RouteContext<"/pedidos/[id]/escenas/subir">) {
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const query = new URLSearchParams({
    nombre: searchParams.get("nombre") ?? "",
    archivo: searchParams.get("archivo") ?? "",
  });

  let res: Response;
  try {
    res = await fetch(`${API_URL}/pedidos/${encodeURIComponent(id)}/escenas?${query}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-teowin-3d", ...(await authHeaders()) },
      body: await req.arrayBuffer(),
      cache: "no-store",
    });
  } catch {
    return Response.json({ message: "No se pudo comunicar con el servidor." }, { status: 502 });
  }
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  return Response.json({ message: body?.message ?? null }, { status: res.status });
}
