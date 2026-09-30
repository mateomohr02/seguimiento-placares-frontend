"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api/api-client";

export type MarcarModuloPendienteResult = { success: true } | { success: false; message: string };

export async function marcarModuloPendienteAction(
  moduloId: string,
  pedidoId: string,
): Promise<MarcarModuloPendienteResult> {
  try {
    await apiFetch(`/modulos/${moduloId}/pendiente`, { method: "PATCH" });
    revalidatePath(`/pedidos/${pedidoId}`);
    revalidatePath(`/modulos/${moduloId}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Error inesperado al pasar el módulo a Pendiente.";
    return { success: false, message };
  }
}
