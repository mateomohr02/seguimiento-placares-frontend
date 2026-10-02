"use client";

import { Trash2Icon } from "lucide-react";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { eliminarHojaCorteAction } from "../actions/eliminar-hoja-corte.action";
import type { HojaCorte } from "../types/hoja-corte.types";

export function HojaCorteEliminar({ hoja }: { hoja: HojaCorte }) {
  return (
    <ConfirmActionButton
      variant="destructive"
      ariaLabel="Eliminar hoja de corte"
      label={<Trash2Icon />}
      title="¿Eliminar la hoja de corte?"
      description={<>Se quitará «{hoja.nombre}» de la orden. Podés volver a cargar el PDF cuando quieras.</>}
      confirmLabel="Eliminar"
      successMessage="Hoja de corte eliminada."
      errorTitle="No se pudo eliminar la hoja"
      run={() => eliminarHojaCorteAction(hoja.id)}
    />
  );
}
