"use client";

import { Trash2Icon } from "lucide-react";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { eliminarPlanoPedidoAction } from "../actions/eliminar-plano-pedido.action";
import type { PlanoPedido } from "../types/plano-pedido.types";

export function PlanoEliminar({ plano }: { plano: PlanoPedido }) {
  return (
    <ConfirmActionButton
      variant="destructive"
      ariaLabel="Eliminar plano"
      label={<Trash2Icon />}
      title="¿Eliminar el plano?"
      description={
        <>Se quitará «{plano.nombre}» del pedido, con sus anotaciones. Podés volver a cargarlo cuando quieras.</>
      }
      confirmLabel="Eliminar"
      successMessage="Plano eliminado."
      errorTitle="No se pudo eliminar el plano"
      run={() => eliminarPlanoPedidoAction(plano.id)}
    />
  );
}
