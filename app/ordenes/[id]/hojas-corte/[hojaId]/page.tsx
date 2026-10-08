import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import type { Orden } from "@/modules/orden/types/orden.types";
import type { HojaCorte } from "@/modules/hoja-corte/types/hoja-corte.types";
import { HojaCorteVisor } from "@/modules/hoja-corte/components/hoja-corte-visor";
import { notFound } from "next/navigation";

export default async function HojaCorteVisorPage({
  params,
}: {
  params: Promise<{ id: string; hojaId: string }>;
}) {
  const { id, hojaId } = await params;
  const sesion = await requireSesion();
  const [orden, hojas] = await Promise.all([
    apiFetch<Orden>(`/ordenes/${id}`),
    apiFetch<HojaCorte[]>(`/ordenes/${id}/hojas-corte`),
  ]);
  const hoja = hojas.find((h) => h.id === hojaId);
  if (!hoja) notFound();

  return (
    <HojaCorteVisor
      anotacionesUrl={`/hojas-corte/${hoja.id}/anotaciones`}
      src={`/hojas-corte/${hoja.id}/archivo`}
      titulo={`Orden ${orden.numeroOrdenCustom} — ${hoja.nombre}`}
      volverHref={`/ordenes/${id}/hojas-corte`}
      puedeAnotar={puede(sesion, PERMISOS.DOCUMENTACION_ANOTAR)}
      puedeEliminarAnotaciones={puede(sesion, PERMISOS.ANOTACIONES_ELIMINAR)}
    />
  );
}
