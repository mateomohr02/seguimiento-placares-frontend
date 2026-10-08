"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESION } from "@/lib/auth/sesion";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

export type LoginResult = { success: true } | { success: false; message: string };

// Login por PIN (diseño.md §12): el backend valida el PIN y devuelve un token de
// sesión, que acá se guarda en una cookie httpOnly (el navegador no lo ve).
export async function loginAction(pin: string): Promise<LoginResult> {
  if (!/^\d{4,10}$/.test(pin)) return { success: false, message: "Ingresá tu PIN numérico." };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
      cache: "no-store",
    });
  } catch {
    return { success: false, message: "No se pudo comunicar con el servidor." };
  }
  const body = (await res.json().catch(() => null)) as {
    message?: string;
    data?: { token: string; expiraEnSegundos: number };
  } | null;
  if (!res.ok || !body?.data) {
    return { success: false, message: body?.message ?? "No se pudo iniciar sesión." };
  }

  (await cookies()).set(COOKIE_SESION, body.data.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: body.data.expiraEnSegundos,
    // La app se sirve por HTTPS detrás de Caddy en el servidor; en desarrollo
    // (http://localhost) una cookie "secure" no se guardaría en algunos navegadores.
    secure: process.env.NODE_ENV === "production",
  });
  return { success: true };
}

export async function logoutAction() {
  (await cookies()).delete(COOKIE_SESION);
  redirect("/login");
}
