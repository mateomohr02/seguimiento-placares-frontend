"use client";

import { Trash2Icon } from "lucide-react";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { eliminarEscenaPedidoAction } from "../actions/eliminar-escena-pedido.action";
import type { EscenaPedido } from "../types/escena-pedido.types";

export function EscenaEliminar({ escena }: { escena: EscenaPedido }) {
  return (
    <ConfirmActionButton
      variant="destructive"
      ariaLabel="Eliminar escena"
      label={<Trash2Icon />}
      title="¿Eliminar la escena?"
      description={<>Se quitará «{escena.nombre}» del pedido. Podés volver a cargarla cuando quieras.</>}
      confirmLabel="Eliminar"
      successMessage="Escena eliminada."
      errorTitle="No se pudo eliminar la escena"
      run={() => eliminarEscenaPedidoAction(escena.id)}
    />
  );
}
