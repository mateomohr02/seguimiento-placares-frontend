// Recibe el PDF crudo desde el navegador y lo reenvía al backend. Es un Route
// Handler (no un Server Action) porque los Server Actions limitan el body a 1 MB
// y una hoja de corte pesa 1–2 MB o más.
const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

export async function POST(req: Request, ctx: RouteContext<"/ordenes/[id]/hojas-corte/subir">) {
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const query = new URLSearchParams({
    nombre: searchParams.get("nombre") ?? "",
    archivo: searchParams.get("archivo") ?? "",
  });

  let res: Response;
  try {
    res = await fetch(`${API_URL}/ordenes/${encodeURIComponent(id)}/hojas-corte?${query}`, {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: await req.arrayBuffer(),
      cache: "no-store",
    });
  } catch {
    return Response.json({ message: "No se pudo comunicar con el servidor." }, { status: 502 });
  }
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  return Response.json({ message: body?.message ?? null }, { status: res.status });
}
