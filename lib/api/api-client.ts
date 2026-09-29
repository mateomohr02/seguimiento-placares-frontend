// Cliente de API centralizado — ningún componente/action llama fetch() directo.
// La app todavía no tiene sesión/autenticación (diseño.md §8.2: no hay modelo
// Usuario en el MVP), así que este cliente no maneja cookies httpOnly todavía;
// cuando se agregue auth, es el único lugar que hay que tocar.
const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

interface ApiEnvelope<T> {
  status: "success" | "fail" | "error";
  message?: string;
  data: T;
}

export class ApiError extends Error {}

export async function apiFetch<TResponse>(
  endpoint: string,
  options: { method?: string; body?: unknown } = {},
): Promise<TResponse> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const envelope = (await res.json()) as ApiEnvelope<TResponse>;

  if (!res.ok) {
    throw new ApiError(envelope.message ?? "Error al comunicarse con la API.");
  }

  return envelope.data;
}
