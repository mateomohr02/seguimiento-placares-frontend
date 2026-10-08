"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api/api-client";

export type EliminarDocumentoResult = { success: true } | { success: false; message: string };

// Borrado lógico en la base propia (eliminado_en); el PDF queda en la tabla.
export async function eliminarDocumentoPedidoAction(documentoId: string): Promise<EliminarDocumentoResult> {
  try {
    await apiFetch(`/documentos-pedido/${documentoId}`, { method: "DELETE" });
    revalidatePath("/pedidos/[id]", "page");
    return { success: true };
  } catch (err) {
    unstable_rethrow(err); // deja pasar el redirect al login (sesión vencida)
    const message = err instanceof ApiError ? err.message : "Error inesperado al eliminar el documento.";
    return { success: false, message };
  }
}
