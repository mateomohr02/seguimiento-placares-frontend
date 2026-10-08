import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Sesion } from "./permisos";

// La sesión es una cookie httpOnly con el token que firma el backend (login por
// PIN, diseño.md §12). El navegador nunca ve el token: lo reenvían los server
// components, las Server Actions y los route handlers (proxys) hacia el backend.
export const COOKIE_SESION = "sp_sesion";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE_SESION)?.value;
}

/** Cabecera Authorization para los pedidos al backend ({} si no hay sesión). */
export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Quién es el usuario y qué puede hacer (una consulta al backend por pedido).
// null = sin sesión o sesión inválida/vencida.
export const getSesion = cache(async (): Promise<Sesion | null> => {
  const token = await getToken();
  if (!token) return null;
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("No se pudo verificar la sesión.");
  const body = (await res.json()) as { data: Sesion };
  return body.data;
});

/** Para páginas: devuelve la sesión o manda al login. */
export async function requireSesion(): Promise<Sesion> {
  const sesion = await getSesion();
  if (!sesion) redirect("/login");
  return sesion;
}
