import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { FECHA_RE, hoyLocal } from "@/modules/planilla/lib/estaciones";
import { PlanificacionSemana } from "@/modules/planificacion/components/planificacion-semana";
import type { PlanificacionCatalogo, SemanaPlanificacion } from "@/modules/planificacion/types/planificacion.types";

const DIA_MS = 86_400_000;
const lunesDe = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DIA_MS).toISOString().slice(0, 10);
};

// Planificaciones (Termolaminado: por semana; Calidad: por día, lunes a sábado) que carga técnica; son independientes de las estaciones. Cada operario
// de una estación con estado de producción marca los pedidos que terminó (diseño.md §14.4, §19.5). Admin, técnica y gerencia ven todas; los demás
// ven las asignadas a sus estaciones activas.
export default async function PlanificacionPage({ searchParams }: { searchParams: Promise<{ plantilla?: string; semana?: string; item?: string }> }) {
  const sesion = await requireSesion();
  if (!puede(sesion, PERMISOS.DOCUMENTACION_VER)) notFound();
  const params = await searchParams;
  const planificaciones = await apiFetch<PlanificacionCatalogo[]>("/planificacion/planificaciones");
  const puedeGestionar = puede(sesion, PERMISOS.DOCUMENTACION_GESTIONAR);

  if (planificaciones.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-[96rem] flex-col gap-4 px-4 py-6">
        <h1 className="text-xl font-semibold">Planificación semanal</h1>
        <p className="rounded-lg border p-4 text-sm text-muted-foreground">
          No hay ninguna planificación para vos. Una planificación se asigna a una estación en Planillas › Configurar (campo «Planificación»); para verla
          tenés que ser miembro de una estación activa que la tenga asignada.
        </p>
      </main>
    );
  }

  const planificacion = planificaciones.find((p) => p.clave === params.plantilla) ?? planificaciones[0];
  const semanaActual = lunesDe(hoyLocal());
  const semana = params.semana && FECHA_RE.test(params.semana) ? lunesDe(params.semana) : semanaActual;
  const data = await apiFetch<SemanaPlanificacion>(`/planificacion?plantilla=${encodeURIComponent(planificacion.clave)}&semana=${semana}`);

  return (
    <main className="mx-auto flex w-full max-w-[96rem] flex-col gap-4 px-4 py-6">
      <PlanificacionSemana
        key={`${planificacion.clave}-${semana}`}
        data={data}
        planificaciones={planificaciones}
        puedeGestionar={puedeGestionar}
        semanaActual={semanaActual}
        itemResaltado={params.item ?? null}
      />
    </main>
  );
}
