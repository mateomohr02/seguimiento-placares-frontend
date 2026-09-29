"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api/api-client";
import { CreateOrdenSchema } from "../schemas/create-orden.schema";
import type { Orden } from "../types/orden.types";

export type CreateOrdenActionResult =
  | { success: true; orden: Orden }
  | { success: false; message: string };

export async function createOrdenAction(input: unknown): Promise<CreateOrdenActionResult> {
  const parsed = CreateOrdenSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  try {
    const orden = await apiFetch<Orden>("/ordenes", {
      method: "POST",
      body: parsed.data,
    });
    revalidatePath("/");
    return { success: true, orden };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Error inesperado al agregar la orden.";
    return { success: false, message };
  }
}
