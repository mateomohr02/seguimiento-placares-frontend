import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { FECHA_RE, hoyLocal } from "@/modules/planilla/lib/estaciones";
import { PlanificacionSemana } from "@/modules/planificacion/components/planificacion-semana";
import type { SemanaPlanificacion } from "@/modules/planificacion/types/planificacion.types";

const DIA_MS = 86_400_000;
const lunesDe = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DIA_MS).toISOString().slice(0, 10);
};

// Planificación semanal de Termolaminado (pedidos y reclamos) que carga técnica; cada usuario con un estado de
// producción asignado lo marca en los pedidos que terminó (diseño.md §14.4).
export default async function PlanificacionPage({ searchParams }: { searchParams: Promise<{ semana?: string }> }) {
  const sesion = await requireSesion();
  if (!puede(sesion, PERMISOS.DOCUMENTACION_VER)) notFound();
  const pedida = (await searchParams).semana;
  const semanaActual = lunesDe(hoyLocal());
  const semana = pedida && FECHA_RE.test(pedida) ? lunesDe(pedida) : semanaActual;
  const data = await apiFetch<SemanaPlanificacion>(`/planificacion?semana=${semana}`);

  return (
    <main className="mx-auto flex w-full max-w-[96rem] flex-col gap-4 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">Planificación semanal — Termolaminado</h1>
        <p className="text-sm text-muted-foreground">Pedidos y reclamos de la semana que carga la oficina técnica.</p>
      </div>
      <PlanificacionSemana data={data} puedeGestionar={puede(sesion, PERMISOS.DOCUMENTACION_GESTIONAR)} semanaActual={semanaActual} />
    </main>
  );
}
