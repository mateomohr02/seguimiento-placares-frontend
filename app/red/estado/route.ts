// Comprobador de red (lo consulta <NetworkGuard /> desde el navegador). No usa
// /api/* a propósito: el navegador solo habla con el frontend (Caddy proxea
// todo a Next), el backend nunca se expone directo. Esta ruta responde si el
// frontend está vivo y, de paso, si desde acá se llega al backend.
const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

export async function GET() {
  let backend = false;
  try {
    const res = await fetch(`${API_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    backend = res.ok;
  } catch {
    backend = false;
  }
  return Response.json({ ok: true, backend }, { headers: { "Cache-Control": "no-store" } });
}
