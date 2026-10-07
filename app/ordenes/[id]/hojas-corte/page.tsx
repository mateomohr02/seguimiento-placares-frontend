import Link from "next/link";
import { apiFetch } from "@/lib/api/api-client";
import type { Orden } from "@/modules/orden/types/orden.types";
import type { HojaCorte } from "@/modules/hoja-corte/types/hoja-corte.types";
import { HojasCorteLista } from "@/modules/hoja-corte/components/hojas-corte-lista";
import { HojaCorteSubir } from "@/modules/hoja-corte/components/hoja-corte-subir";

export default async function HojasCortePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orden, hojas] = await Promise.all([
    apiFetch<Orden>(`/ordenes/${id}`),
    apiFetch<HojaCorte[]>(`/ordenes/${id}/hojas-corte`),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div>
        <Link href={`/ordenes/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← Orden {orden.numeroOrdenCustom}
        </Link>
        <h1 className="mt-2 text-xl font-semibold">
          Hojas de corte — Orden {orden.numeroOrdenCustom} — {orden.descripcion}
        </h1>
      </div>

      <HojasCorteLista ordenId={id} hojas={hojas} />

      <HojaCorteSubir
        ordenId={id}
        codigoOrdenFabricacion={orden.codigoOrdenFabricacion}
        numeroOrdenCustom={orden.numeroOrdenCustom}
      />
    </main>
  );
}
