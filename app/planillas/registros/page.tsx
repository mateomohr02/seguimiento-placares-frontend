import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede, puedeCompletarPlanilla } from "@/lib/auth/permisos";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ESTACIONES, ETIQUETA_ESTACION, fechaCorta, hoyLocal, slugEstacion } from "@/modules/planilla/lib/estaciones";
import { FiltrosFecha, rangoPorDefecto, selectClass } from "@/modules/planilla/components/filtros-fecha";
import type { RegistroPlanilla } from "@/modules/planilla/types/planilla.types";

type Filtros = { desde?: string; hasta?: string; estacion?: string; estado?: string; pedido?: string };

export default async function RegistrosPage({ searchParams }: { searchParams: Promise<Filtros> }) {
  const sesion = await requireSesion();
  if (!puede(sesion, PERMISOS.PLANILLAS_VER)) notFound();


  const f = await searchParams;
  const { desde, hasta } = rangoPorDefecto(hoyLocal(), f.desde, f.hasta);
  const query = new URLSearchParams({ desde, hasta });
  if (f.estacion) query.set("estacion", f.estacion);
  if (f.estado) query.set("estado", f.estado);
  if (f.pedido) query.set("pedido", f.pedido);
  const registros = await apiFetch<RegistroPlanilla[]>(`/planillas/registros?${query}`);

  return (
    <main className="mx-auto flex w-full max-w-[96rem] flex-col gap-4 px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Registros de producción — Termolaminado</h1>
          <p className="text-sm text-muted-foreground">Todo lo cargado en las planillas de Lijado, Encolado y PVC, tal cual se completó.</p>
        </div>
        <Link href="/planillas/trazabilidad" className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted">
          Trazabilidad de un pedido
        </Link>
      </div>

      <FiltrosFecha action="/planillas/registros" desde={desde} hasta={hasta}>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Estación</span>
          <select name="estacion" defaultValue={f.estacion ?? ""} className={selectClass}>
            <option value="">Todas</option>
            {ESTACIONES.map((e) => (
              <option key={e} value={e}>
                {ETIQUETA_ESTACION[e]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Estado</span>
          <select name="estado" defaultValue={f.estado ?? ""} className={selectClass}>
            <option value="">Todos</option>
            <option value="GUARDADA">Guardada</option>
            <option value="BORRADOR">Borrador</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">N° de pedido</span>
          <Input name="pedido" defaultValue={f.pedido ?? ""} placeholder="Contiene…" className="h-11 w-44" autoComplete="off" />
        </label>
      </FiltrosFecha>

      <p className="text-sm text-muted-foreground">
        {registros.length} registro{registros.length === 1 ? "" : "s"} del {fechaCorta(desde)} al {fechaCorta(hasta)}.
      </p>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Estación</TableHead>
              <TableHead>N° pedido</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Fin</TableHead>
              <TableHead className="text-right">Piezas</TableHead>
              <TableHead>Colores</TableHead>
              <TableHead className="text-right">Mesa chica</TableHead>
              <TableHead className="text-right">Mesa grande</TableHead>
              <TableHead>Colocación PVC</TableHead>
              <TableHead>Perfilado</TableHead>
              <TableHead>Operarios</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead className="text-center">Fotos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {registros.length === 0 && (
              <TableRow>
                <TableCell colSpan={16} className="py-8 text-center text-muted-foreground">
                  No hay registros con esos filtros.
                </TableCell>
              </TableRow>
            )}
            {registros.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">{fechaCorta(r.fecha)}</TableCell>
                <TableCell>{ETIQUETA_ESTACION[r.estacion]}</TableCell>
                <TableCell className="font-medium whitespace-nowrap">
                  {r.pedido_codigo ? (
                    <Link href={`/planillas/trazabilidad?pedido=${encodeURIComponent(r.pedido_codigo)}`} className="underline-offset-4 hover:underline">
                      {r.pedido_codigo}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{r.hora_inicio ?? "—"}</TableCell>
                <TableCell>{r.hora_fin ?? "—"}</TableCell>
                <TableCell className="text-right">{r.cantidad_piezas ?? "—"}</TableCell>
                <TableCell>{r.colores ?? "—"}</TableCell>
                <TableCell className="text-right">{r.estacion === "PVC" ? (r.mesa_chica ?? "—") : "—"}</TableCell>
                <TableCell className="text-right">{r.estacion === "PVC" ? (r.mesa_grande ?? "—") : "—"}</TableCell>
                <TableCell className="max-w-48 truncate">{r.colocacion_pvc ?? "—"}</TableCell>
                <TableCell className="max-w-48 truncate">{r.perfilado ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap">{r.operarios.join(", ") || "—"}</TableCell>
                <TableCell className="max-w-64 truncate" title={r.observaciones ?? undefined}>
                  {r.observaciones ?? "—"}
                </TableCell>
                <TableCell className="text-center">
                  {r.fotos > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <ImageIcon className="size-4" /> {r.fotos}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={r.estado === "GUARDADA" ? "default" : "secondary"}>{r.estado === "GUARDADA" ? "Guardada" : "Borrador"}</Badge>
                  {r.versiones > 0 && <span className="ml-1 text-xs text-muted-foreground">corregida</span>}
                </TableCell>
                <TableCell>
                  <Link href={`/planillas/detalle/${r.planilla_id}`} className="text-sm underline-offset-4 hover:underline">
                    Detalle
                  </Link>
                  {puedeCompletarPlanilla(sesion, r.estacion) && (
                    <>
                      {" · "}
                      <Link
                        href={`/planillas/${slugEstacion(r.estacion)}?fecha=${r.fecha}`}
                        className="text-sm underline-offset-4 hover:underline"
                      >
                        Abrir
                      </Link>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
