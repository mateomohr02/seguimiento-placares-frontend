"use client";

import { ETIQUETA_PLANTILLA } from "@/modules/planificacion/types/planificacion.types";
import { useState } from "react";
import { PencilIcon, PlusIcon, PowerIcon, PowerOffIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { nombreCompleto } from "@/lib/auth/permisos";
import { ETIQUETA_ESTACION } from "@/modules/planilla/lib/estaciones";
import type { EstadoProduccion } from "@/modules/planilla/types/planilla.types";
import { actualizarEstacionAction } from "../actions/estacion-trabajo.actions";
import type { EstacionTrabajo, UsuarioDeEstacion } from "../types/estacion-trabajo.types";
import { EstacionDialog } from "./estacion-dialog";

// Estaciones de trabajo (técnica): sus planillas, su estado de producción y sus operarios. No se borran: se
// desactivan (sus operarios dejan de verlas y sus planillas históricas se conservan) y se pueden reactivar.
export function EstacionesConfig({
  estaciones,
  estados,
  usuarios,
}: {
  estaciones: EstacionTrabajo[];
  estados: EstadoProduccion[];
  /** Todas las personas, para asignarlas (null = sin permiso usuarios.gestionar). */
  usuarios: UsuarioDeEstacion[] | null;
}) {
  const [verInactivas, setVerInactivas] = useState(false);
  const estadoPorId = new Map(estados.map((e) => [e.id, e]));
  const inactivas = estaciones.filter((e) => !e.activa).length;
  const visibles = estaciones
    .filter((e) => verInactivas || e.activa)
    .sort((a, b) => Number(b.activa) - Number(a.activa) || a.nombre.localeCompare(b.nombre, "es"));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <EstacionDialog
          estados={estados}
          usuarios={usuarios}
          trigger={
            <Button className="h-11 px-4">
              <PlusIcon /> Nueva estación
            </Button>
          }
        />
        {inactivas > 0 && (
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" className="size-5 accent-(--primary)" checked={verInactivas} onChange={(e) => setVerInactivas(e.target.checked)} />
            Mostrar desactivadas ({inactivas})
          </label>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {visibles.map((e) => {
          const estado = e.estado_id ? estadoPorId.get(e.estado_id) : undefined;
          const operarios = e.usuarios.filter((u) => u.activo);
          const deBaja = e.usuarios.length - operarios.length;
          return (
            <li key={e.id} className={`flex flex-col gap-3 rounded-lg border p-4 ${e.activa ? "" : "bg-muted/40"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold">{e.nombre}</h3>
                {!e.activa && <Badge variant="destructive">Desactivada</Badge>}
                <div className="ml-auto flex flex-wrap gap-2">
                  <EstacionDialog
                    estacion={e}
                    estados={estados}
                    usuarios={usuarios}
                    trigger={
                      <Button variant="outline" className="h-11 px-3">
                        <PencilIcon /> Editar
                      </Button>
                    }
                  />
                  {e.activa ? (
                    <ConfirmActionButton
                      variant="destructive"
                      className="h-11 px-3"
                      label={
                        <>
                          <PowerOffIcon /> Desactivar
                        </>
                      }
                      title={`¿Desactivar ${e.nombre}?`}
                      description="Sus operarios dejan de ver sus planillas y su estado de producción. Las planillas ya hechas se conservan y se puede reactivar."
                      confirmLabel="Desactivar"
                      successMessage={`${e.nombre}: desactivada.`}
                      errorTitle="No se pudo desactivar la estación"
                      run={() => actualizarEstacionAction(e.id, { activa: false })}
                    />
                  ) : (
                    <ConfirmActionButton
                      className="h-11 px-3"
                      label={
                        <>
                          <PowerIcon /> Reactivar
                        </>
                      }
                      title={`¿Reactivar ${e.nombre}?`}
                      description="Vuelve a estar disponible para sus operarios, con sus planillas, su estado y sus usuarios."
                      confirmLabel="Reactivar"
                      successMessage={`${e.nombre}: reactivada.`}
                      errorTitle="No se pudo reactivar la estación"
                      run={() => actualizarEstacionAction(e.id, { activa: true })}
                    />
                  )}
                </div>
              </div>

              <dl className="grid gap-3 text-sm md:grid-cols-4">
                <div>
                  <dt className="font-medium">Planillas</dt>
                  <dd className="text-muted-foreground">{e.planillas.length > 0 ? e.planillas.map((p) => ETIQUETA_ESTACION[p] ?? p).join(" · ") : "Ninguna"}</dd>
                </div>
                <div>
                  <dt className="font-medium">Estado de producción</dt>
                  <dd className="flex items-center gap-2 text-muted-foreground">
                    {estado?.color && <span className="size-3 rounded-full" style={{ backgroundColor: estado.color }} aria-hidden />}
                    {estado?.nombre ?? "Ninguno"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Planificación</dt>
                  <dd className="text-muted-foreground">{e.plantilla_planificacion ? ETIQUETA_PLANTILLA[e.plantilla_planificacion] : "Ninguna"}</dd>
                </div>
                <div>
                  <dt className="font-medium">Operarios</dt>
                  <dd className="text-muted-foreground">
                    {operarios.length > 0 ? operarios.map(nombreCompleto).join(", ") : "Ninguno"}
                    {deBaja > 0 && ` (+${deBaja} dado${deBaja === 1 ? "" : "s"} de baja)`}
                  </dd>
                </div>
              </dl>
            </li>
          );
        })}
        {visibles.length === 0 && <li className="rounded-lg border p-4 text-sm text-muted-foreground">Todavía no hay estaciones de trabajo.</li>}
      </ul>
    </div>
  );
}
