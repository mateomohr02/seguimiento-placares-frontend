// Llamada del navegador a un route handler proxy de reordenamiento (PUT con JSON, respuesta 204).
// Devuelve null si salió bien o el mensaje de error para mostrar.
export async function enviarOrden(url: string, body: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) return null;
    if (res.status === 401) return "La sesión venció: recargá la página e ingresá tu PIN.";
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    return data?.message ?? "El servidor rechazó el cambio.";
  } catch {
    return "No se pudo comunicar con el servidor.";
  }
}
