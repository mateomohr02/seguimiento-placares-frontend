"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api/api-client";
import { EscanearPiezaSchema } from "../schemas/escanear-pieza.schema";
import type { EscaneoResumen } from "../types/pieza.types";

export type EscanearPiezaResult =
  | { success: true; resumen: EscaneoResumen }
  | { success: false; message: string };

// Vista 5 — escaneo continuo. La pantalla de escaneo mantiene su propio estado
// (mini-resumen); se invalidan las demás rutas para que reflejen el escaneo.
export async function escanearPiezaAction(input: unknown): Promise<EscanearPiezaResult> {
  const parsed = EscanearPiezaSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Código inválido." };
  }

  try {
    const resumen = await apiFetch<EscaneoResumen>("/piezas/escanear", {
      method: "POST",
      body: parsed.data,
    });
    // Cambia estados que se ven en las otras vistas (no toca el estado del escáner).
    revalidatePath("/", "layout");
    return { success: true, resumen };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Error inesperado al escanear la pieza.";
    return { success: false, message };
  }
}
