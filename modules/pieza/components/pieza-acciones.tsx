"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { confirmarPiezaAction } from "../actions/confirmar-pieza.action";
import { marcarPiezaPendienteAction } from "../actions/marcar-pieza-pendiente.action";
import type { Pieza } from "../types/pieza.types";

export function PiezaAcciones({ pieza }: { pieza: Pieza }) {
  const nombre = `${pieza.descripcion ?? `${pieza.familia} / ${pieza.articulo}`} (${pieza.idUnico ?? "sin código"})`;

  return (
    <div className="flex justify-end gap-2">
      <ConfirmActionButton
        label="Finalizado"
        title="¿Marcar pieza como finalizada?"
        description={<>Se marcará como cortada: {nombre}.</>}
        successMessage="Pieza marcada como finalizada."
        errorTitle="No se pudo finalizar la pieza"
        disabled={pieza.estado !== "PENDIENTE"}
        run={async () => {
          const r = await confirmarPiezaAction(pieza.id);
          return r.success ? { success: true } : r;
        }}
      />
      <ConfirmActionButton
        label="Pendiente"
        title="¿Volver la pieza a Pendiente?"
        description={<>Se deshará el corte de: {nombre}.</>}
        successMessage="Pieza vuelta a Pendiente."
        errorTitle="No se pudo pasar la pieza a Pendiente"
        disabled={pieza.estado !== "CORTADA"}
        run={() => marcarPiezaPendienteAction(pieza.id)}
      />
    </div>
  );
}
