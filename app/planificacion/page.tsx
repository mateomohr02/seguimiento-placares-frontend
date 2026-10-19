import Link from "next/link";
import { notFound } from "next/navigation";
import { FileTextIcon } from "lucide-react";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { fechaCorta, hoyLocal } from "@/modules/planilla/lib/estaciones";
import { PlanificacionEliminar } from "@/modules/planificacion/components/planificacion-eliminar";
import { PlanificacionSubir } from "@/modules/planificacion/components/planificacion-subir";
import { ETIQUETA_TIPO, esImagen, type PlanificacionDoc } from "@/modules/planificacion/types/planificacion.types";

const DIA_MS = 86_400_000;
const mas = (iso: string, dias: number) => new Date(new Date(`${iso}T00:00:00Z`).getTime() + dias * DIA_MS).toISOString().slice(0, 10);

function lunesDe(iso: string) {
  const dow = (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
  return mas(iso, -dow);
}

const fechaHora = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" });

// Planificación semanal (pedidos y reclamos) del área de Termolaminado: la sube la oficina
// técnica y la consultan las estaciones. Hoy es una por semana para toda el área.
export default async function PlanificacionPage() {
  const sesion = await requireSesion();
  if (!puede(sesion, PERMISOS.DOCUMENTACION_VER)) notFound();
  const puedeGestionar = puede(sesion, PERMISOS.DOCUMENTACION_GESTIONAR);
  const docs = await apiFetch<PlanificacionDoc[]>("/planificacion");

  const hoy = hoyLocal();
  const semanaActual = lunesDe(hoy);
  const semanas = [...new Set([semanaActual, ...docs.map((d) => d.semana_inicio)])].sort().reverse();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">Planificación semanal — Termolaminado</h1>
        <p className="text-sm text-muted-foreground">Pedidos y reclamos de la semana que baja la oficina técnica.</p>
      </div>

      {puedeGestionar && <PlanificacionSubir hoy={hoy} />}

      {semanas.map((s) => {
        const delaSemana = docs.filter((d) => d.semana_inicio === s);
        return (
          <section key={s} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">
              Semana del {fechaCorta(s)} al {fechaCorta(mas(s, 4))}
              {s === semanaActual && <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-medium text-gold">Esta semana</span>}
            </h2>
            {delaSemana.length === 0 ? (
              <p className="rounded-lg border p-4 text-sm text-muted-foreground">Todavía no hay planificación cargada para esta semana.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {delaSemana.map((d) => (
                  <li key={d.id} className="flex flex-col gap-2 rounded-lg border bg-background p-3">
                    <Link href={`/planificacion/${d.id}`} className="block" aria-label={`Abrir ${d.nombre}`}>
                      <div className="flex h-40 items-center justify-center overflow-hidden rounded-md bg-muted">
                        {esImagen(d.mime) ? (
                          // eslint-disable-next-line @next/next/no-img-element -- archivo servido por un proxy propio
                          <img src={`/planificacion/${d.id}/archivo`} alt="" loading="lazy" className="size-full object-contain" />
                        ) : (
                          <FileTextIcon className="size-10 text-muted-foreground" />
                        )}
                      </div>
                    </Link>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{d.nombre}</div>
                      <div className="truncate text-sm text-muted-foreground">{ETIQUETA_TIPO[d.tipo]}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {d.nombre_archivo} · cargado {fechaHora.format(new Date(d.creado_en))}
                      </div>
                    </div>
                    <div className="mt-auto flex items-center gap-2">
                      <Link
                        href={`/planificacion/${d.id}`}
                        className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
                      >
                        Abrir
                      </Link>
                      {puedeGestionar && <PlanificacionEliminar doc={d} />}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </main>
  );
}
