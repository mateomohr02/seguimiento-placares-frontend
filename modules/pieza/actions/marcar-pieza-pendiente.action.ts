"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api/api-client";

export type MarcarPiezaPendienteResult = { success: true } | { success: false; message: string };

export async function marcarPiezaPendienteAction(
  piezaId: string,
  moduloId: string,
): Promise<MarcarPiezaPendienteResult> {
  try {
    await apiFetch(`/piezas/${piezaId}/pendiente`, { method: "PATCH" });
    revalidatePath(`/modulos/${moduloId}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Error inesperado al pasar la pieza a Pendiente.";
    return { success: false, message };
  }
}
