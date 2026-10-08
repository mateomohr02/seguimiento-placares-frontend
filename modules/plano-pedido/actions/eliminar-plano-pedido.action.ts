"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api/api-client";

export type EliminarPlanoResult = { success: true } | { success: false; message: string };

// Borrado lógico en la base propia (eliminado_en); el archivo queda en la tabla.
export async function eliminarPlanoPedidoAction(planoId: string): Promise<EliminarPlanoResult> {
  try {
    await apiFetch(`/planos-pedido/${planoId}`, { method: "DELETE" });
    revalidatePath("/pedidos/[id]", "page");
    return { success: true };
  } catch (err) {
    unstable_rethrow(err); // deja pasar el redirect al login (sesión vencida)
    const message = err instanceof ApiError ? err.message : "Error inesperado al eliminar el plano.";
    return { success: false, message };
  }
}
