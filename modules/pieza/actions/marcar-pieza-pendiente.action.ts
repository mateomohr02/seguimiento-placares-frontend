"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api/api-client";

export type MarcarPiezaPendienteResult = { success: true } | { success: false; message: string };

export async function marcarPiezaPendienteAction(piezaId: string): Promise<MarcarPiezaPendienteResult> {
  try {
    await apiFetch(`/piezas/${piezaId}/pendiente`, { method: "PATCH" });
    // Los estados se propagan entre niveles (pieza/módulo/pedido/orden): se invalida todo
    // para que ninguna vista (incluida la de arriba, al volver) muestre estados viejos.
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    unstable_rethrow(err); // deja pasar el redirect al login (sesión vencida)
    const message = err instanceof ApiError ? err.message : "Error inesperado al pasar la pieza a Pendiente.";
    return { success: false, message };
  }
}
