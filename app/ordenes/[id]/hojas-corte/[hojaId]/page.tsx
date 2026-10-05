import { apiFetch } from "@/lib/api/api-client";
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
  const [orden, hojas] = await Promise.all([
    apiFetch<Orden>(`/ordenes/${id}`),
    apiFetch<HojaCorte[]>(`/ordenes/${id}/hojas-corte`),
  ]);
  const hoja = hojas.find((h) => h.id === hojaId);
  if (!hoja) notFound();

  return (
    <HojaCorteVisor
      hojaId={hoja.id}
      src={`/hojas-corte/${hoja.id}/archivo`}
      titulo={`Orden ${orden.numeroOrdenCustom} — ${hoja.nombre}`}
      volverHref={`/ordenes/${id}/hojas-corte`}
    />
  );
}
