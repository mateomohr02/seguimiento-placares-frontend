// Cliente de API centralizado — ningún componente/action llama fetch() directo.
// Reenvía el token de la sesión (cookie httpOnly, diseño.md §12) como Authorization.
// Si el backend responde 401 (sesión vencida o usuario dado de baja) se redirige
// al login. Un 403 llega como ApiError con el motivo.
import { redirect } from "next/navigation";
import { authHeaders } from "@/lib/auth/sesion";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

interface ApiEnvelope<T> {
  status: "success" | "fail" | "error";
  message?: string;
  data: T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export async function apiFetch<TResponse>(
  endpoint: string,
  options: { method?: string; body?: unknown } = {},
): Promise<TResponse> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const envelope = (await res.json()) as ApiEnvelope<TResponse>;

  if (res.status === 401) redirect("/login");

  if (!res.ok) {
    throw new ApiError(envelope.message ?? "Error al comunicarse con la API.", res.status);
  }

  return envelope.data;
}
