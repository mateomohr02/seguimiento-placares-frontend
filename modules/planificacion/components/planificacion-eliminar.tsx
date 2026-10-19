"use client";

import { Trash2Icon } from "lucide-react";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { eliminarPlanificacionAction } from "../actions/eliminar-planificacion.action";
import type { PlanificacionDoc } from "../types/planificacion.types";

export function PlanificacionEliminar({ doc }: { doc: PlanificacionDoc }) {
  return (
    <ConfirmActionButton
      variant="destructive"
      ariaLabel="Eliminar documento"
      label={<Trash2Icon />}
      title="¿Eliminar el documento?"
      description={<>Se quitará «{doc.nombre}» de la planificación. Podés volver a cargarlo cuando quieras.</>}
      confirmLabel="Eliminar"
      successMessage="Documento eliminado."
      errorTitle="No se pudo eliminar el documento"
      run={() => eliminarPlanificacionAction(doc.id)}
    />
  );
}
