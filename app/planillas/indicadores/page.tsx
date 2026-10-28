import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangleIcon, ArrowRightIcon, CheckCircle2Icon } from "lucide-react";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ESTACIONES, ETIQUETA_ESTACION, fechaCorta, formatoMinutos, hoyLocal } from "@/modules/planilla/lib/estaciones";
import { FiltrosFecha, rangoPorDefecto } from "@/modules/planilla/components/filtros-fecha";
import type { Estacion, Indicadores } from "@/modules/planilla/types/planilla.types";

const COLOR: Record<Estacion, string> = { LIJADO: "var(--chart-2)", ENCOLADO: "var(--chart-1)", PVC: "var(--foreground)" };

export default async function IndicadoresPage({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string }> }) {
  const sesion = await requireSesion();
  if (!puede(sesion, PERMISOS.PLANILLAS_INDICADORES)) notFound();

  const f = await searchParams;
  const { desde, hasta } = rangoPorDefecto(hoyLocal(), f.desde, f.hasta);
  const ind = await apiFetch<Indicadores>(`/planillas/indicadores?desde=${desde}&hasta=${hasta}`);
  const maxDia = Math.max(1, ...ind.porDia.flatMap((d) => ESTACIONES.map((e) => d.piezas[e])));
  const maxMesas = Math.max(1, ...(ind.mesasPorDia ?? []).flatMap((d) => [d.chicas, d.grandes]));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Indicadores — Termolaminado</h1>
          <p className="text-sm text-muted-foreground">
            Calculados con lo cargado en las planillas (guardadas y borradores) del {fechaCorta(desde)} al {fechaCorta(hasta)}.
          </p>
        </div>
        <Link href="/planillas/trazabilidad" className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted">
          Trazabilidad de un pedido
        </Link>
      </div>
      <FiltrosFecha action="/planillas/indicadores" desde={desde} hasta={hasta} />

      <section aria-label="Por estación" className="grid gap-3 sm:grid-cols-3">
        {ind.porEstacion.map((e, i) => (
          <div key={e.estacion} className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {i + 1}. {ETIQUETA_ESTACION[e.estacion]}
              </h2>
              <span className="size-3 rounded-full" style={{ background: COLOR[e.estacion] }} aria-hidden />
            </div>
            <div className="text-3xl font-semibold">
              {e.piezas} <span className="text-base font-normal text-muted-foreground">piezas</span>
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Pedidos</dt>
              <dd className="text-right">{e.pedidos}</dd>
              <dt className="text-muted-foreground">{e.estacion === "PVC" ? "Tandas de mesas" : "Registros"}</dt>
              <dd className="text-right">{e.registros}</dd>
              {e.estacion === "PVC" && (
                <>
                  <dt className="text-muted-foreground">Mesas chicas</dt>
                  <dd className="text-right">{e.mesas_chicas ?? 0}</dd>
                  <dt className="text-muted-foreground">Mesas grandes</dt>
                  <dd className="text-right">{e.mesas_grandes ?? 0}</dd>
                </>
              )}
              <dt className="text-muted-foreground">Días con carga</dt>
              <dd className="text-right">{e.dias}</dd>
              <dt className="text-muted-foreground">Tiempo trabajado</dt>
              <dd className="text-right">{e.minutos > 0 ? formatoMinutos(e.minutos) : "—"}</dd>
              <dt className="text-muted-foreground">Piezas por hora</dt>
              <dd className="text-right">{e.piezasPorHora ?? "—"}</dd>
              {e.estacion === "PVC" && (
                <>
                  <dt className="text-muted-foreground">Mesas por hora</dt>
                  <dd className="text-right">{e.mesas_por_hora ?? "—"}</dd>
                </>
              )}
            </dl>
          </div>
        ))}
      </section>

      <section aria-label="Piezas por día" className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Piezas por día</h2>
          <ul className="flex gap-4 text-sm">
            {ESTACIONES.map((e) => (
              <li key={e} className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm" style={{ background: COLOR[e] }} aria-hidden /> {ETIQUETA_ESTACION[e]}
              </li>
            ))}
          </ul>
        </div>
        {ind.porDia.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay cargas en este rango.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {ind.porDia.map((d) => (
              <li key={d.fecha} className="grid grid-cols-[5.5rem_1fr] items-center gap-3">
                <span className="text-sm text-muted-foreground">{fechaCorta(d.fecha)}</span>
                <div className="flex flex-col gap-1">
                  {ESTACIONES.map((e) => (
                    <div key={e} className="flex items-center gap-2">
                      <div className="h-3 rounded-sm" style={{ width: `${(d.piezas[e] / maxDia) * 100}%`, minWidth: d.piezas[e] > 0 ? 4 : 0, background: COLOR[e] }} />
                      <span className="text-xs tabular-nums">{d.piezas[e]}</span>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Mesas de PVC por día" className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Mesas de PVC por día</h2>
          <ul className="flex gap-4 text-sm">
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm" style={{ background: "var(--chart-2)" }} aria-hidden /> Chicas
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm" style={{ background: "var(--foreground)" }} aria-hidden /> Grandes
            </li>
          </ul>
        </div>
        {(ind.mesasPorDia ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay mesas de PVC cargadas en este rango.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {ind.mesasPorDia.map((d) => (
              <li key={d.fecha} className="grid grid-cols-[5.5rem_1fr] items-center gap-3">
                <span className="text-sm text-muted-foreground">{fechaCorta(d.fecha)}</span>
                <div className="flex flex-col gap-1">
                  {(
                    [
                      ["Chicas", d.chicas, "var(--chart-2)"],
                      ["Grandes", d.grandes, "var(--foreground)"],
                    ] as const
                  ).map(([nombre, n, color]) => (
                    <div key={nombre} className="flex items-center gap-2">
                      <div className="h-3 rounded-sm" style={{ width: `${(n / maxMesas) * 100}%`, minWidth: n > 0 ? 4 : 0, background: color }} />
                      <span className="text-xs tabular-nums">
                        {n} <span className="sr-only">{nombre.toLowerCase()}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Pedidos" className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Trazabilidad de los pedidos del período</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Resumen titulo="Pedidos" valor={ind.pedidos.total} />
          <Resumen titulo="Pasaron por las 3 estaciones" valor={ind.pedidos.completos} />
          <Resumen titulo="En proceso" valor={ind.pedidos.enProceso} />
          <Resumen titulo="Con diferencia de piezas" valor={ind.pedidos.conDiferencia} aviso={ind.pedidos.conDiferencia > 0} />
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° pedido</TableHead>
                {ESTACIONES.map((e) => (
                  <TableHead key={e} className="text-right">
                    {ETIQUETA_ESTACION[e]} (piezas)
                  </TableHead>
                ))}
                <TableHead>Situación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ind.pedidos.detalle.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No hay pedidos en este rango.
                  </TableCell>
                </TableRow>
              )}
              {ind.pedidos.detalle.map((p) => (
                <TableRow key={p.pedido}>
                  <TableCell className="font-medium">
                    <Link href={`/planillas/trazabilidad?pedido=${encodeURIComponent(p.pedido)}`} className="underline-offset-4 hover:underline">
                      {p.pedido}
                    </Link>
                  </TableCell>
                  {ESTACIONES.map((e) => (
                    <TableCell key={e} className="text-right">
                      {p.estaciones[e].registros > 0 ? p.estaciones[e].piezas : "—"}
                    </TableCell>
                  ))}
                  <TableCell>
                    {p.completo ? (
                      <span className="inline-flex items-center gap-1 text-sm">
                        <CheckCircle2Icon className="size-4" /> Completo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <ArrowRightIcon className="size-4" /> Falta {p.siguiente ? ETIQUETA_ESTACION[p.siguiente] : ""}
                      </span>
                    )}
                    {p.diferencia && (
                      <span className="ml-2 inline-flex items-center gap-1 text-sm text-destructive">
                        <AlertTriangleIcon className="size-4" /> Piezas distintas
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}

function Resumen({ titulo, valor, aviso = false }: { titulo: string; valor: number; aviso?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <span className="text-sm text-muted-foreground">{titulo}</span>
      <span className={`text-2xl font-semibold ${aviso ? "text-destructive" : ""}`}>{valor}</span>
    </div>
  );
}
