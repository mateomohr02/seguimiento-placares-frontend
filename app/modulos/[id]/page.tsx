import Link from "next/link";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { PiezasTable } from "@/modules/pieza/components/piezas-table";
import type { Pieza } from "@/modules/pieza/types/pieza.types";
import type { ModuloConContexto } from "@/modules/modulo/types/modulo.types";
import { EstadoBadge } from "@/components/estado-badge";

export default async function ModuloDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pieza?: string }>;
}) {
  const { id } = await params;
  const { pieza: piezaId } = await searchParams;
  const sesion = await requireSesion();
  const [modulo, piezas] = await Promise.all([
    apiFetch<ModuloConContexto>(`/modulos/${id}`),
    apiFetch<Pieza[]>(`/modulos/${id}/piezas`),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div>
        <div className="flex items-center gap-4">
          <Link href={`/pedidos/${modulo.pedido.id}`} className="text-sm text-muted-foreground hover:underline">
            ← Pedido {modulo.pedido.codigo_pedido}
          </Link>
          {piezaId && (
            <Link href="/escaneo" className="text-sm text-muted-foreground hover:underline">
              ← Volver al escaneo
            </Link>
          )}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-xl font-semibold">
            Módulo {modulo.idEscena} — {modulo.descripcion}
          </h1>
          <EstadoBadge estado={modulo.estado} />
        </div>
      </div>

      <PiezasTable piezas={piezas} puedeMarcar={puede(sesion, PERMISOS.PIEZAS_MARCAR)} resaltarId={piezaId} />
    </main>
  );
}
