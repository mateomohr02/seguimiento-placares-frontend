// Reenvía un pedido JSON del navegador al backend (el navegador solo habla con
// el frontend; el backend no se expone). Devuelve el sobre del backend tal cual
// y conserva el código de estado.
const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

export async function proxyJson(path: string, init: { method: string; body?: string }): Promise<Response> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: init.method,
      headers: { "Content-Type": "application/json" },
      body: init.body,
      cache: "no-store",
    });
    const body = await res.json().catch(() => null);
    return Response.json(body ?? { message: "Respuesta inválida del servidor." }, { status: res.status });
  } catch {
    return Response.json({ message: "No se pudo comunicar con el servidor." }, { status: 502 });
  }
}
