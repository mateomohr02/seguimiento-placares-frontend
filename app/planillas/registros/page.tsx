import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede, puedeCompletarPlanilla } from "@/lib/auth/permisos";
import { ESTACIONES, fechaCorta, hoyLocal } from "@/modules/planilla/lib/estaciones";
import { FiltrosFecha, rangoPorDefecto } from "@/modules/planilla/components/filtros-fecha";
import { RegistrosPlanillas } from "@/modules/planilla/components/registros-planillas";
import type { RegistroPlanilla } from "@/modules/planilla/types/planilla.types";

// Registros de producción de Termolaminado: una tabla por planilla (Lijado, Encolado, PVC). El rango de fechas se pide
// al servidor; el resto de los filtros son por columna, en cada tabla.
export default async function RegistrosPage({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string }> }) {
  const sesion = await requireSesion();
  if (!puede(sesion, PERMISOS.PLANILLAS_VER)) notFound();

  const f = await searchParams;
  const { desde, hasta } = rangoPorDefecto(hoyLocal(), f.desde, f.hasta);
  const registros = await apiFetch<RegistroPlanilla[]>(`/planillas/registros?desde=${desde}&hasta=${hasta}`);
  const abribles = ESTACIONES.filter((e) => puedeCompletarPlanilla(sesion, e));

  return (
    <main className="mx-auto flex w-full max-w-[96rem] flex-col gap-5 px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Registros de producción — Termolaminado</h1>
          <p className="text-sm text-muted-foreground">
            Lo cargado en cada planilla, tal cual se completó, del {fechaCorta(desde)} al {fechaCorta(hasta)}. Cada tabla se filtra por columna con el ícono del embudo.
          </p>
        </div>
        <Link href="/planillas/trazabilidad" className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted">
          Trazabilidad de un pedido
        </Link>
      </div>

      <FiltrosFecha action="/planillas/registros" desde={desde} hasta={hasta} />

      <RegistrosPlanillas registros={registros} abribles={abribles} />
    </main>
  );
}
