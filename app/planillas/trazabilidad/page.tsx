import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, ImageIcon } from "lucide-react";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, estacionesVisibles, puede } from "@/lib/auth/permisos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ESTACIONES, ETIQUETA_ESTACION, fechaCorta, formatoMinutos } from "@/modules/planilla/lib/estaciones";
import type { Trazabilidad } from "@/modules/planilla/types/planilla.types";

// Recorrido de un pedido por Lijado → Encolado → PVC según las planillas.
export default async function TrazabilidadPage({ searchParams }: { searchParams: Promise<{ pedido?: string }> }) {
  const sesion = await requireSesion();
  const visibles = ESTACIONES.filter((e) => estacionesVisibles(sesion).includes(e));
  if (!puede(sesion, PERMISOS.PLANILLAS_VER) || visibles.length === 0) notFound();

  const pedido = ((await searchParams).pedido ?? "").trim();
  const traza = pedido ? await apiFetch<Trazabilidad>(`/planillas/trazabilidad?pedido=${encodeURIComponent(pedido)}`) : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">Trazabilidad de un pedido</h1>
        <p className="text-sm text-muted-foreground">Por qué estaciones pasó un pedido, cuándo y cuántas piezas se registraron en cada una.</p>
      </div>

      <form action="/planillas/trazabilidad" method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">N° de pedido</span>
          <Input name="pedido" defaultValue={pedido} placeholder="Ej. 26-02689" autoComplete="off" autoCapitalize="characters" className="h-11 w-56" />
        </label>
        <Button type="submit" className="h-11 px-5">
          Buscar
        </Button>
      </form>

      {traza && (
        <>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">
              {traza.pedido}
              {traza.referencia ? <span className="ml-2 text-sm font-normal text-muted-foreground">{traza.referencia}</span> : null}
            </h2>
            {traza.pedido_id && (
              <Link href={`/pedidos/${traza.pedido_id}`} className="text-sm underline underline-offset-4">
                Ver el pedido
              </Link>
            )}
          </div>

          <ol className="grid gap-3 sm:grid-cols-3">
            {visibles.map((e, i) => {
              const r = traza.estaciones[e]!;
              const paso = r.registros > 0;
              return (
                <li key={e} className={`flex flex-col gap-1 rounded-lg border p-4 ${paso ? "" : "border-dashed text-muted-foreground"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {i + 1}. {ETIQUETA_ESTACION[e]}
                    </span>
                    {i < visibles.length - 1 && <ArrowRightIcon className="size-4 text-muted-foreground" aria-hidden />}
                  </div>
                  {paso ? (
                    <>
                      <span className="text-2xl font-semibold">{r.piezas} piezas</span>
                      <span className="text-sm">
                        {r.primera === r.ultima ? fechaCorta(r.primera!) : `${fechaCorta(r.primera!)} – ${fechaCorta(r.ultima!)}`}
                        {r.minutos > 0 ? ` · ${formatoMinutos(r.minutos)}` : ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm">Todavía no pasó</span>
                  )}
                </li>
              );
            })}
          </ol>

          {traza.diferencia && (
            <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              La cantidad de piezas no coincide entre las estaciones por las que pasó este pedido.
            </p>
          )}

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Planilla</TableHead>
                  <TableHead>Estación de trabajo</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead className="text-right">Piezas</TableHead>
                  <TableHead>Observaciones</TableHead>
                  <TableHead className="text-center">Fotos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {traza.registros.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                      Ese pedido no figura en ninguna planilla.
                    </TableCell>
                  </TableRow>
                )}
                {traza.registros.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{fechaCorta(r.fecha)}</TableCell>
                    <TableCell>{ETIQUETA_ESTACION[r.estacion]}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.estacion_trabajo?.nombre ?? "—"}</TableCell>
                    <TableCell>{r.hora_inicio ?? "—"}</TableCell>
                    <TableCell>{r.hora_fin ?? "—"}</TableCell>
                    <TableCell className="text-right">{r.cantidad_piezas ?? "—"}</TableCell>
                    <TableCell className="max-w-64 truncate">{r.observaciones ?? "—"}</TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Link href={`/planillas/detalle/${r.planilla_id}`} className="text-sm underline-offset-4 hover:underline">
                        Detalle
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </main>
  );
}
