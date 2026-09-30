"use client";

import { ArchiveIcon, ArchiveRestoreIcon, Trash2Icon } from "lucide-react";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { archivarOrdenAction } from "../actions/archivar-orden.action";
import { eliminarOrdenAction } from "../actions/orden-estado.action";
import type { Orden } from "../types/orden.types";

export function OrdenAcciones({ orden, archivada }: { orden: Orden; archivada: boolean }) {
  const nombre = `${orden.numeroOrdenCustom} — ${orden.descripcion}`;

  return (
    <div className="flex justify-end gap-2">
      <ConfirmActionButton
        label={
          archivada ? (
            <>
              <ArchiveRestoreIcon /> Desarchivar
            </>
          ) : (
            <>
              <ArchiveIcon /> Archivar
            </>
          )
        }
        title={archivada ? "¿Desarchivar la orden?" : "¿Archivar la orden?"}
        description={
          archivada ? (
            <>Orden {nombre} volverá al listado principal.</>
          ) : (
            <>Orden {nombre} dejará de mostrarse en el listado principal (no se elimina ni cambia de estado).</>
          )
        }
        successMessage={archivada ? "Orden desarchivada." : "Orden archivada."}
        errorTitle="No se pudo actualizar la orden"
        run={async () => {
          const r = await archivarOrdenAction(orden.id, !archivada);
          return r.success ? { success: true } : r;
        }}
      />
      <ConfirmActionButton
        variant="destructive"
        ariaLabel="Eliminar orden"
        label={<Trash2Icon />}
        title="¿Eliminar la orden?"
        description={
          <>
            Orden {nombre}. Se marcarán como eliminados la orden, sus pedidos, módulos y piezas (el
            historial se conserva). Las etiquetas ya impresas dejarán de ser válidas. TeoWin no se
            modifica.
          </>
        }
        requireText="confirmar"
        confirmLabel="Eliminar"
        successMessage={`Orden ${orden.numeroOrdenCustom} eliminada.`}
        errorTitle="No se pudo eliminar la orden"
        run={() => eliminarOrdenAction(orden.id)}
      />
    </div>
  );
}
