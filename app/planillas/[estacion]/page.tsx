import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, estacionesConPlanilla, puede, puedeCompletarPlanilla } from "@/lib/auth/permisos";
import { ETIQUETA_ESTACION, estacionDeSlug, FECHA_RE, rutaPlanilla } from "@/modules/planilla/lib/estaciones";
import type { EstacionTrabajo } from "@/modules/estacion-trabajo/types/estacion-trabajo.types";

// Inicio de las planillas de un tipo (Lijado, Encolado o PVC). Una planilla es de una estación de trabajo, así que
// si el usuario está en una sola estación con ese tipo entra directo; si está en varias, elige en cuál. Técnica y
// admin (planillas.configurar) pueden abrir las de cualquier estación activa que la tenga.
export default async function InicioPlanillaPage({
  params,
  searchParams,
}: {
  params: Promise<{ estacion: string }>;
  searchParams: Promise<{ fecha?: string; elegir?: string }>;
}) {
  const tipo = estacionDeSlug((await params).estacion);
  if (!tipo) notFound();
  const sesion = await requireSesion();
  if (!puedeCompletarPlanilla(sesion, tipo)) notFound();

  const query = await searchParams;
  const pedida = query.fecha;
  const fecha = pedida && FECHA_RE.test(pedida) ? pedida : undefined;

  const todas = puede(sesion, PERMISOS.PLANILLAS_CONFIGURAR);
  const estaciones: { id: string; nombre: string }[] = todas
    ? (await apiFetch<EstacionTrabajo[]>("/estaciones-trabajo")).filter((e) => e.activa && e.planillas.includes(tipo))
    : estacionesConPlanilla(sesion, tipo);

  if (estaciones.length === 1 && query.elegir !== "1") redirect(rutaPlanilla(tipo, estaciones[0].id, fecha));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">Planilla de {ETIQUETA_ESTACION[tipo]}</h1>
        <p className="text-sm text-muted-foreground">
          {estaciones.length > 0
            ? "Elegí la estación de trabajo en la que estás completando la planilla."
            : `No hay ninguna estación de trabajo con la planilla de ${ETIQUETA_ESTACION[tipo]}.`}
        </p>
      </div>
      {estaciones.length === 0 ? (
        <p className="rounded-lg border border-gold/50 bg-gold/10 p-4 text-sm">
          {todas
            ? "Asignale esta planilla a una estación en Termolaminado > Configurar."
            : `No estás en ninguna estación con la planilla de ${ETIQUETA_ESTACION[tipo]}. Pedile a técnica que te asigne a una.`}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {estaciones.map((e) => (
            <li key={e.id}>
              <Link
                href={rutaPlanilla(tipo, e.id, fecha)}
                className="flex min-h-14 items-center justify-between gap-3 rounded-lg border px-4 py-3 text-base font-medium transition hover:bg-muted active:scale-[0.99]"
              >
                {e.nombre}
                <ChevronRightIcon className="size-5 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
