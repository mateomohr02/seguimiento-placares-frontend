import { apiFetch } from "@/lib/api/api-client";
import { VolverLink } from "@/components/volver-link";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { PiezasTable } from "@/modules/pieza/components/piezas-table";
import type { Pieza } from "@/modules/pieza/types/pieza.types";
import type { ModuloConContexto } from "@/modules/modulo/types/modulo.types";
import { EstadoBadge } from "@/components/estado-badge";
import { LineaBadge } from "@/components/linea-badge";
import { PartidaEncabezado } from "@/modules/modulo/components/partida-encabezado";

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
        <div className="flex flex-wrap items-center gap-2">
          <VolverLink href={`/pedidos/${modulo.pedido.id}`}>Pedido {modulo.pedido.codigo_pedido}</VolverLink>
          {piezaId && (
            <VolverLink href="/escaneo" variante="acento">
              Volver al escaneo
            </VolverLink>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">
            Módulo {modulo.idEscena} — {modulo.descripcion}
          </h1>
          <EstadoBadge estado={modulo.estado} />
          {modulo.linea && <LineaBadge linea={modulo.linea} />}
        </div>
      </div>

      <PartidaEncabezado partida={modulo.partida ?? null} />

      <PiezasTable piezas={piezas} puedeMarcar={puede(sesion, PERMISOS.PIEZAS_MARCAR)} resaltarId={piezaId} />
    </main>
  );
}
