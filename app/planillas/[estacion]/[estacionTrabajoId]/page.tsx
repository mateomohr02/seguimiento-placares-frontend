import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, estacionesConPlanilla, puede, puedeAbrirPlanillaDe } from "@/lib/auth/permisos";
import { ETIQUETA_ESTACION, estacionDeSlug, FECHA_RE, hoyLocal, slugEstacion } from "@/modules/planilla/lib/estaciones";
import type { Planilla } from "@/modules/planilla/types/planilla.types";
import { PlanillaForm } from "@/modules/planilla/components/planilla-form";

export default async function PlanillaPage({
  params,
  searchParams,
}: {
  params: Promise<{ estacion: string; estacionTrabajoId: string }>;
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { estacion: slug, estacionTrabajoId } = await params;
  const tipo = estacionDeSlug(slug);
  if (!tipo) notFound();
  const sesion = await requireSesion();
  if (!puedeAbrirPlanillaDe(sesion, tipo, estacionTrabajoId)) notFound();

  const pedida = (await searchParams).fecha;
  const fecha = pedida && FECHA_RE.test(pedida) ? pedida : hoyLocal();

  let planilla: Planilla;
  let colores: string[];
  try {
    [planilla, colores] = await Promise.all([
      apiFetch<Planilla>(`/planillas/dia/${encodeURIComponent(estacionTrabajoId)}/${tipo}/${fecha}`),
      apiFetch<string[]>("/planillas/colores"),
    ]);
  } catch (e) {
    if (e instanceof ApiError && [400, 403, 404].includes(e.status ?? 0)) notFound();
    throw e;
  }

  // ¿Hay otra estación entre la que elegir? (varias propias con este tipo, o técnica/admin, que ven todas)
  const puedeElegir = puede(sesion, PERMISOS.PLANILLAS_CONFIGURAR) || estacionesConPlanilla(sesion, tipo).length > 1;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6 lg:gap-3 lg:py-4">
      <div>
        <h1 className="text-xl font-semibold">
          Planilla de {ETIQUETA_ESTACION[tipo]} — {planilla.estacion_trabajo.nombre}
        </h1>
        <p className="text-sm text-muted-foreground lg:hidden">
          Parte diario de Termolaminado. Se completa durante el día; lo que cargues queda guardado como borrador hasta que la guardes.
        </p>
        {puedeElegir && (
          <Link href={`/planillas/${slugEstacion(tipo)}?elegir=1`} className="text-sm underline underline-offset-4">
            Cambiar de estación
          </Link>
        )}
      </div>
      <PlanillaForm key={`${estacionTrabajoId}-${tipo}-${fecha}`} tipo={tipo} estacionTrabajoId={estacionTrabajoId} fecha={fecha} inicial={planilla} colores={colores} />
    </main>
  );
}
