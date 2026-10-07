"use client";

import { Trash2Icon } from "lucide-react";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { eliminarDocumentoPedidoAction } from "../actions/eliminar-documento-pedido.action";
import type { DocumentoPedido } from "../types/documento-pedido.types";

export function DocumentoEliminar({ documento }: { documento: DocumentoPedido }) {
  return (
    <ConfirmActionButton
      variant="destructive"
      ariaLabel="Eliminar documento"
      label={<Trash2Icon />}
      title="¿Eliminar el documento?"
      description={
        <>Se quitará «{documento.nombre}» del pedido, con sus anotaciones. Podés volver a cargar el PDF cuando quieras.</>
      }
      confirmLabel="Eliminar"
      successMessage="Documento eliminado."
      errorTitle="No se pudo eliminar el documento"
      run={() => eliminarDocumentoPedidoAction(documento.id)}
    />
  );
}
