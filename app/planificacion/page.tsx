import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { FECHA_RE, hoyLocal } from "@/modules/planilla/lib/estaciones";
import { PlanificacionSemana } from "@/modules/planificacion/components/planificacion-semana";
import type { EstacionPlanificacion, SemanaPlanificacion } from "@/modules/planificacion/types/planificacion.types";

const DIA_MS = 86_400_000;
const lunesDe = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DIA_MS).toISOString().slice(0, 10);
};

// Planificación semanal de una estación de trabajo (hoy, plantilla Termolaminado: pedidos y reclamos) que carga técnica; cada operario
// de una estación con estado de producción lo marca en los pedidos que terminó (diseño.md §14.4). `fabrica` ve solo sus estaciones.
export default async function PlanificacionPage({ searchParams }: { searchParams: Promise<{ estacion?: string; semana?: string; item?: string }> }) {
  const sesion = await requireSesion();
  if (!puede(sesion, PERMISOS.DOCUMENTACION_VER)) notFound();
  const params = await searchParams;
  const estaciones = await apiFetch<EstacionPlanificacion[]>("/planificacion/estaciones");
  const puedeGestionar = puede(sesion, PERMISOS.DOCUMENTACION_GESTIONAR);

  if (estaciones.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-[96rem] flex-col gap-4 px-4 py-6">
        <h1 className="text-xl font-semibold">Planificación semanal</h1>
        <p className="rounded-lg border p-4 text-sm text-muted-foreground">
          No hay ninguna estación de trabajo con planificación para vos. La planificación se activa en Planillas › Configurar, eligiendo una «Plantilla de
          planificación» en la estación; para verla tenés que estar asignado a esa estación.
        </p>
      </main>
    );
  }

  const estacion = estaciones.find((e) => e.id === params.estacion) ?? estaciones[0];
  const semanaActual = lunesDe(hoyLocal());
  const semana = params.semana && FECHA_RE.test(params.semana) ? lunesDe(params.semana) : semanaActual;
  const data = await apiFetch<SemanaPlanificacion>(`/planificacion?estacion=${encodeURIComponent(estacion.id)}&semana=${semana}`);

  return (
    <main className="mx-auto flex w-full max-w-[96rem] flex-col gap-4 px-4 py-6">
      <PlanificacionSemana
        key={`${estacion.id}-${semana}`}
        data={data}
        estaciones={estaciones}
        puedeGestionar={puedeGestionar}
        semanaActual={semanaActual}
        itemResaltado={params.item ?? null}
      />
    </main>
  );
}
