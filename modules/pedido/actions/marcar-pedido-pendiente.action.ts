"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api/api-client";

export type MarcarPedidoPendienteResult = { success: true } | { success: false; message: string };

export async function marcarPedidoPendienteAction(
  pedidoId: string,
  ordenId: string,
): Promise<MarcarPedidoPendienteResult> {
  try {
    await apiFetch(`/pedidos/${pedidoId}/pendiente`, { method: "PATCH" });
    revalidatePath(`/ordenes/${ordenId}`);
    revalidatePath(`/pedidos/${pedidoId}`);
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Error inesperado al pasar el pedido a Pendiente.";
    return { success: false, message };
  }
}
