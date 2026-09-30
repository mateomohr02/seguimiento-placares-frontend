"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { marcarModuloFinalizadoAction } from "../actions/marcar-modulo-finalizado.action";
import { marcarModuloPendienteAction } from "../actions/marcar-modulo-pendiente.action";
import type { Modulo } from "../types/modulo.types";

export function ModuloAcciones({ modulo, pedidoId }: { modulo: Modulo; pedidoId: string }) {
  const nombre = `${modulo.descripcion} (${modulo.idEscena})`;

  return (
    <div className="flex justify-end gap-2">
      <ConfirmActionButton
        label="Finalizado"
        title="¿Marcar módulo como finalizado?"
        description={<>Módulo {nombre}.</>}
        successMessage="Módulo marcado como finalizado."
        errorTitle="No se pudo finalizar el módulo"
        disabled={modulo.estado === "FINALIZADO"}
        run={async () => {
          const r = await marcarModuloFinalizadoAction(modulo.id, pedidoId);
          return r.success ? { success: true } : r;
        }}
      />
      <ConfirmActionButton
        label="Pendiente"
        title="¿Volver el módulo a Pendiente?"
        description={
          <>
            Módulo {nombre}. Solo es posible si ninguna de sus piezas está finalizada.
          </>
        }
        successMessage="Módulo vuelto a Pendiente."
        errorTitle="No se pudo pasar el módulo a Pendiente"
        disabled={modulo.estado === "PENDIENTE"}
        run={() => marcarModuloPendienteAction(modulo.id, pedidoId)}
      />
    </div>
  );
}
