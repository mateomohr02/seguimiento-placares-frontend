"use client";

import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { limpiarHistorialEscaneo } from "@/modules/pieza/hooks/use-historial-escaneo";
import { logoutAction } from "../actions/login.action";

// Cerrar sesión: además de borrar la cookie, limpia lo que la sesión dejó en el
// navegador (historial de escaneo).
export function SalirForm() {
  return (
    <form action={logoutAction} onSubmit={limpiarHistorialEscaneo}>
      <Button type="submit" variant="ghost" size="sm" className="gap-1">
        <LogOutIcon /> Salir
      </Button>
    </form>
  );
}
