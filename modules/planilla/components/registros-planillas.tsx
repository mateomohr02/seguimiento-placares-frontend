"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { ColumnFilter } from "@/components/column-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ESTACIONES, ETIQUETA_ESTACION, fechaCorta, slugEstacion } from "../lib/estaciones";
import type { Estacion, RegistroPlanilla } from "../types/planilla.types";

// Registros de producción de Termolaminado: una tabla por planilla (Lijado, Encolado y PVC), cada una con sus columnas y
// con filtros por columna al estilo Excel. El recuento de cada tabla sigue a los filtros.

interface Col {
  key: string;
  label: string;
  /** Texto de la celda: es el valor que se filtra (las columnas sin filtro no lo necesitan). */
  value: (r: RegistroPlanilla) => string;
  filtrable: boolean;
  align?: "right" | "center";
  /** Celda a medida (por defecto, el `value`). */
  render?: (r: RegistroPlanilla) => ReactNode;
  /** Orden de las opciones del filtro (por defecto, alfabético con números). */
  sortKey?: (r: RegistroPlanilla) => string;
  className?: string;
}

const v = (x: string | number | null) => (x === null || x === "" ? "—" : String(x));

const COL_FECHA: Col = { key: "fecha", label: "Fecha", value: (r) => fechaCorta(r.fecha), sortKey: (r) => r.fecha, filtrable: true, className: "whitespace-nowrap" };
const COL_PEDIDO: Col = {
  key: "pedido",
  label: "N° pedido",
  value: (r) => v(r.pedido_codigo),
  filtrable: true,
  className: "font-medium whitespace-nowrap",
  render: (r) =>
    r.pedido_codigo ? (
      <Link href={`/planillas/trazabilidad?pedido=${encodeURIComponent(r.pedido_codigo)}`} className="underline-offset-4 hover:underline">
        {r.pedido_codigo}
      </Link>
    ) : (
      "—"
    ),
};
const COL_INICIO: Col = { key: "inicio", label: "Inicio", value: (r) => v(r.hora_inicio), filtrable: false };
const COL_FIN: Col = { key: "fin", label: "Fin", value: (r) => v(r.hora_fin), filtrable: false };
const COL_PIEZAS: Col = { key: "piezas", label: "Piezas", value: (r) => v(r.cantidad_piezas), filtrable: true, align: "right" };
const COL_OPERARIOS: Col = { key: "operarios", label: "Operarios", value: (r) => r.operarios.join(", ") || "—", filtrable: true, className: "whitespace-nowrap" };
const COL_OBS: Col = { key: "obs", label: "Observaciones", value: (r) => v(r.observaciones), filtrable: false, className: "max-w-64 truncate" };
const COL_ESTADO: Col = {
  key: "estado",
  label: "Estado",
  value: (r) => (r.estado === "GUARDADA" ? (r.versiones > 0 ? "Guardada (corregida)" : "Guardada") : "Borrador"),
  filtrable: true,
  render: (r) => (
    <>
      <Badge variant={r.estado === "GUARDADA" ? "default" : "secondary"}>{r.estado === "GUARDADA" ? "Guardada" : "Borrador"}</Badge>
      {r.versiones > 0 && <span className="ml-1 text-xs text-muted-foreground">corregida</span>}
    </>
  ),
};

const COLUMNAS: Record<Estacion, Col[]> = {
  LIJADO: [COL_FECHA, COL_PEDIDO, COL_INICIO, COL_FIN, COL_PIEZAS, COL_OPERARIOS, COL_OBS, COL_ESTADO],
  ENCOLADO: [COL_FECHA, COL_PEDIDO, COL_INICIO, COL_FIN, COL_PIEZAS, COL_OPERARIOS, COL_OBS, COL_ESTADO],
  PVC: [
    COL_FECHA,
    COL_PEDIDO,
    COL_INICIO,
    COL_FIN,
    { ...COL_PIEZAS, label: "Piezas (total)" },
    { key: "colores", label: "Colores", value: (r) => v(r.colores), filtrable: true },
    { key: "chica", label: "Mesa chica", value: (r) => v(r.mesa_chica), filtrable: true, align: "right" },
    { key: "grande", label: "Mesa grande", value: (r) => v(r.mesa_grande), filtrable: true, align: "right" },
    { key: "colocacion", label: "Colocación PVC", value: (r) => v(r.colocacion_pvc), filtrable: true, className: "max-w-48 truncate" },
    { key: "perfilado", label: "Perfilado", value: (r) => v(r.perfilado), filtrable: true, className: "max-w-48 truncate" },
    COL_OPERARIOS,
    COL_OBS,
    {
      key: "fotos",
      label: "Fotos",
      value: (r) => (r.fotos > 0 ? String(r.fotos) : "—"),
      filtrable: true,
      align: "center",
      render: (r) =>
        r.fotos > 0 ? (
          <span className="inline-flex items-center gap-1">
            <ImageIcon className="size-4" /> {r.fotos}
          </span>
        ) : (
          "—"
        ),
    },
    COL_ESTADO,
  ],
};

type Seleccion = Record<string, Set<string> | null | undefined>;

const ordenar = (a: string, b: string) => a.localeCompare(b, "es", { numeric: true });

function TablaEstacion({ estacion, registros, puedeAbrir }: { estacion: Estacion; registros: RegistroPlanilla[]; puedeAbrir: boolean }) {
  const columnas = COLUMNAS[estacion];
  const filtrables = columnas.filter((c) => c.filtrable);
  const [seleccion, setSeleccion] = useState<Seleccion>({});

  const pasa = (r: RegistroPlanilla, omitir?: string) =>
    filtrables.every((c) => {
      const s = seleccion[c.key];
      return c.key === omitir || !s || s.has(c.value(r));
    });

  const filas = useMemo(() => registros.filter((r) => pasa(r)), [registros, seleccion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Las opciones de cada columna salen de las filas que cumplen los demás filtros (como Excel).
  const opciones = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const c of filtrables) {
      const base = registros.filter((r) => pasa(r, c.key));
      const valores = new Map<string, string>(); // texto → clave de orden
      for (const r of base) valores.set(c.value(r), c.sortKey ? c.sortKey(r) : c.value(r));
      seleccion[c.key]?.forEach((x) => valores.has(x) || valores.set(x, x));
      out[c.key] = [...valores.entries()].sort(([ta, ka], [tb, kb]) => (c.sortKey ? kb.localeCompare(ka) : ordenar(ta, tb))).map(([t]) => t);
    }
    return out;
  }, [registros, seleccion]); // eslint-disable-line react-hooks/exhaustive-deps

  const activos = filtrables.filter((c) => seleccion[c.key]).length;
  const piezas = filas.reduce((s, r) => s + (r.cantidad_piezas ?? 0), 0);
  const piezasTotal = registros.reduce((s, r) => s + (r.cantidad_piezas ?? 0), 0);
  const filtrado = filas.length !== registros.length;

  return (
    <section id={slugEstacion(estacion)} className="flex scroll-mt-20 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {ETIQUETA_ESTACION[estacion]}{" "}
          <span className="text-sm font-normal text-muted-foreground" aria-live="polite">
            {filtrado ? `${filas.length} de ${registros.length} registros` : `${registros.length} registro${registros.length === 1 ? "" : "s"}`}
            {" · "}
            {filtrado ? `${piezas} de ${piezasTotal} piezas` : `${piezasTotal} pieza${piezasTotal === 1 ? "" : "s"}`}
          </span>
        </h2>
        {activos > 0 && (
          <Button size="sm" variant="ghost" onClick={() => setSeleccion({})}>
            Limpiar {activos === 1 ? "filtro" : `${activos} filtros`}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columnas.map((c) => (
                <TableHead key={c.key} className={c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : undefined}>
                  <div className={`flex items-center gap-1 ${c.align === "right" ? "justify-end" : c.align === "center" ? "justify-center" : ""}`}>
                    {c.label}
                    {c.filtrable && (
                      <ColumnFilter
                        label={c.label}
                        options={opciones[c.key] ?? []}
                        selected={seleccion[c.key] ?? null}
                        onChange={(next) => setSeleccion((s) => ({ ...s, [c.key]: next }))}
                      />
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.length === 0 && (
              <TableRow>
                <TableCell colSpan={columnas.length + 1} className="py-8 text-center text-muted-foreground">
                  {registros.length === 0 ? `No hay registros de ${ETIQUETA_ESTACION[estacion]} en este período.` : "Ningún registro coincide con los filtros."}
                </TableCell>
              </TableRow>
            )}
            {filas.map((r) => (
              <TableRow key={r.id}>
                {columnas.map((c) => (
                  <TableCell key={c.key} className={`${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""} ${c.className ?? ""}`} title={c.className?.includes("truncate") ? c.value(r) : undefined}>
                    {c.render ? c.render(r) : c.value(r)}
                  </TableCell>
                ))}
                <TableCell className="whitespace-nowrap">
                  <Link href={`/planillas/detalle/${r.planilla_id}`} className="text-sm underline-offset-4 hover:underline">
                    Detalle
                  </Link>
                  {puedeAbrir && (
                    <>
                      {" · "}
                      <Link href={`/planillas/${slugEstacion(r.estacion)}?fecha=${r.fecha}`} className="text-sm underline-offset-4 hover:underline">
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
    </section>
  );
}

export function RegistrosPlanillas({ registros, abribles }: { registros: RegistroPlanilla[]; abribles: Estacion[] }) {
  const porEstacion = useMemo(
    () => Object.fromEntries(ESTACIONES.map((e) => [e, registros.filter((r) => r.estacion === e)])) as Record<Estacion, RegistroPlanilla[]>,
    [registros],
  );
  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Planillas" className="flex flex-wrap gap-2">
        {ESTACIONES.map((e) => (
          <a key={e} href={`#${slugEstacion(e)}`} className="inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium hover:bg-muted">
            {ETIQUETA_ESTACION[e]} ({porEstacion[e].length})
          </a>
        ))}
      </nav>
      {ESTACIONES.map((e) => (
        <TablaEstacion key={e} estacion={e} registros={porEstacion[e]} puedeAbrir={abribles.includes(e)} />
      ))}
    </div>
  );
}
