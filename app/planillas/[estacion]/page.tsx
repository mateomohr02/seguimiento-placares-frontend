import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { ETIQUETA_ESTACION, estacionDeSlug, FECHA_RE, hoyLocal, slugEstacion } from "@/modules/planilla/lib/estaciones";
import type { OperariosArea, Planilla } from "@/modules/planilla/types/planilla.types";
import { PlanillaForm } from "@/modules/planilla/components/planilla-form";

export default async function PlanillaPage({
  params,
  searchParams,
}: {
  params: Promise<{ estacion: string }>;
  searchParams: Promise<{ fecha?: string }>;
}) {
  const estacion = estacionDeSlug((await params).estacion);
  if (!estacion) notFound();
  const sesion = await requireSesion();
  if (!puede(sesion, PERMISOS.PLANILLAS_COMPLETAR)) notFound();

  const pedida = (await searchParams).fecha;
  const fecha = pedida && FECHA_RE.test(pedida) ? pedida : hoyLocal();

  const [planilla, operarios, colores] = await Promise.all([
    apiFetch<Planilla | null>(`/planillas/dia/${slugEstacion(estacion)}/${fecha}`),
    apiFetch<OperariosArea>("/planillas/operarios"),
    apiFetch<string[]>("/planillas/colores"),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">Planilla de {ETIQUETA_ESTACION[estacion]}</h1>
        <p className="text-sm text-muted-foreground">
          Parte diario de Termolaminado. Se completa durante el día; lo que cargues queda guardado como borrador hasta que la guardes.
        </p>
      </div>
      <PlanillaForm
        key={`${estacion}-${fecha}`}
        estacion={estacion}
        fecha={fecha}
        inicial={planilla}
        operariosConfigurados={operarios.operarios}
        colores={colores}
      />
    </main>
  );
}
