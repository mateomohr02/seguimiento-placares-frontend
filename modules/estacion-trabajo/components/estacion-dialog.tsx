"use client";

import { useState, useTransition, type ReactElement, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/loading-dots";
import { SeleccionMultiple } from "@/components/seleccion-multiple";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { nombreCompleto } from "@/lib/auth/permisos";
import { ESTACIONES, ETIQUETA_ESTACION } from "@/modules/planilla/lib/estaciones";
import { ETIQUETA_PLANTILLA, type PlantillaPlanificacion } from "@/modules/planificacion/types/planificacion.types";
import type { EstadoProduccion } from "@/modules/planilla/types/planilla.types";
import { actualizarEstacionAction, crearEstacionAction } from "../actions/estacion-trabajo.actions";
import type { EstacionTrabajo, EstacionTrabajoCambios, EstacionTrabajoInput, UsuarioDeEstacion } from "../types/estacion-trabajo.types";

const SELECT =
  "h-11 rounded-lg border border-input bg-background px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

interface Valores extends EstacionTrabajoInput {
  usuarios_ids: string[];
}

const vacio = (): Valores => ({ nombre: "", planillas: [], estado_id: null, plantilla_planificacion: null, usuarios_ids: [] });
const desdeEstacion = (e: EstacionTrabajo): Valores => ({
  nombre: e.nombre,
  planillas: e.planillas,
  estado_id: e.estado_id,
  plantilla_planificacion: e.plantilla_planificacion,
  usuarios_ids: e.usuarios.map((u) => u.id),
});

const mismo = (a: string[], b: string[]) => [...a].sort().join() === [...b].sort().join();

function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{etiqueta}</span>
      {children}
    </label>
  );
}

// Alta y edición de una estación de trabajo: nombre, planillas que completan sus operarios, estado de producción que
// marca en la planificación y usuarios asignados. Sin `usuarios` (no tiene usuarios.gestionar) no se asignan desde acá.
export function EstacionDialog({
  estacion,
  estados,
  usuarios,
  trigger,
}: {
  /** Con `estacion` se edita; sin ella, se da de alta. */
  estacion?: EstacionTrabajo;
  estados: EstadoProduccion[];
  /** Todas las personas (null = sin permiso para listarlas). */
  usuarios: UsuarioDeEstacion[] | null;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<Valores>(() => (estacion ? desdeEstacion(estacion) : vacio()));
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  // Se ofrecen los usuarios activos y, además, los inactivos que ya estaban asignados (para poder quitarlos).
  const opcionesUsuario = (usuarios ?? [])
    .filter((u) => u.activo || estacion?.usuarios.some((x) => x.id === u.id))
    .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), "es"))
    .map((u) => ({ id: u.id, etiqueta: nombreCompleto(u), detalle: u.activo ? undefined : "dado de baja" }));

  function abrir(next: boolean) {
    if (pendiente) return;
    setOpen(next);
    if (next) {
      setV(estacion ? desdeEstacion(estacion) : vacio());
      setError(null);
    }
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const nombre = v.nombre.trim();
    if (!nombre) return setError("Falta el nombre de la estación.");
    setError(null);
    const planillas = ESTACIONES.filter((p) => v.planillas.includes(p));
    startTransition(async () => {
      let r;
      if (!estacion) {
        r = await crearEstacionAction({ nombre, planillas, estado_id: v.estado_id, plantilla_planificacion: v.plantilla_planificacion }, usuarios ? v.usuarios_ids : []);
      } else {
        const c: EstacionTrabajoCambios = {};
        if (nombre !== estacion.nombre) c.nombre = nombre;
        if (!mismo(planillas, estacion.planillas)) c.planillas = planillas;
        if (v.estado_id !== estacion.estado_id) c.estado_id = v.estado_id;
        if (v.plantilla_planificacion !== estacion.plantilla_planificacion) c.plantilla_planificacion = v.plantilla_planificacion;
        if (usuarios && !mismo(v.usuarios_ids, estacion.usuarios.map((u) => u.id))) c.usuarios_ids = v.usuarios_ids;
        if (Object.keys(c).length === 0) {
          setOpen(false);
          return;
        }
        r = await actualizarEstacionAction(estacion.id, c);
      }
      if (!r.success) return setError(r.message);
      toast.success(estacion ? `${nombre}: guardada.` : `${nombre}: estación creada.`);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={abrir}>
      <DialogTrigger render={trigger} />
      <DialogContent showCloseButton={false} className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={guardar} className="flex flex-col gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>{estacion ? `Editar ${estacion.nombre}` : "Nueva estación de trabajo"}</DialogTitle>
            <DialogDescription>
              Los operarios asignados completan sus planillas y pueden marcar su estado de producción en la planificación. Los cambios los ven al recargar la página.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <Campo etiqueta="Nombre">
              <Input
                value={v.nombre}
                onChange={(e) => setV((p) => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej. termolaminado1"
                maxLength={60}
                autoComplete="off"
                className="h-11"
                required
              />
            </Campo>
            <Campo etiqueta="Estado de producción">
              <select value={v.estado_id ?? ""} onChange={(e) => setV((p) => ({ ...p, estado_id: e.target.value || null }))} className={SELECT}>
                <option value="">Ninguno</option>
                {estados.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Plantilla de planificación">
              <select
                value={v.plantilla_planificacion ?? ""}
                onChange={(e) => setV((p) => ({ ...p, plantilla_planificacion: (e.target.value || null) as PlantillaPlanificacion | null }))}
                className={SELECT}
              >
                <option value="">Ninguna</option>
                {(Object.keys(ETIQUETA_PLANTILLA) as PlantillaPlanificacion[]).map((k) => (
                  <option key={k} value={k}>
                    {ETIQUETA_PLANTILLA[k]}
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">Con plantilla, la estación tiene su propia planificación semanal; sin ella no aparece en Planificación.</span>
            </Campo>
          </div>

          <fieldset className="flex flex-col gap-1.5 text-sm">
            <legend className="mb-1 font-medium">Planillas que completa</legend>
            <SeleccionMultiple
              className="sm:grid-cols-3"
              opciones={ESTACIONES.map((p) => ({ id: p, etiqueta: ETIQUETA_ESTACION[p] }))}
              seleccion={v.planillas}
              onChange={(ids) => setV((p) => ({ ...p, planillas: ESTACIONES.filter((x) => ids.includes(x)) }))}
              disabled={pendiente}
            />
          </fieldset>

          <fieldset className="flex flex-col gap-1.5 text-sm">
            <legend className="mb-1 font-medium">Operarios de la estación</legend>
            {usuarios ? (
              <SeleccionMultiple
                opciones={opcionesUsuario}
                seleccion={v.usuarios_ids}
                onChange={(ids) => setV((p) => ({ ...p, usuarios_ids: ids }))}
                disabled={pendiente}
                vacio="Todavía no hay usuarios (se crean en la pantalla Usuarios)."
              />
            ) : (
              <p className="text-muted-foreground">
                {estacion && estacion.usuarios.length > 0 ? estacion.usuarios.map(nombreCompleto).join(", ") : "Ninguno"}. Los asigna quien gestiona los usuarios.
              </p>
            )}
          </fieldset>

          {error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" className="h-11 px-4" disabled={pendiente} onClick={() => abrir(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="h-11 px-5" disabled={pendiente}>
              {pendiente ? <LoadingDots /> : estacion ? "Guardar" : "Crear estación"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
