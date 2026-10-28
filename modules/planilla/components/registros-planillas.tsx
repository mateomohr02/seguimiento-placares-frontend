"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { ColumnFilter } from "@/components/column-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ETIQUETA_ESTACION, etiquetaMesa, fechaCorta, rutaPlanilla, slugEstacion } from "../lib/estaciones";
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
const COL_ESTACION: Col = { key: "estacion", label: "Estación", value: (r) => r.estacion_trabajo?.nombre ?? "—", filtrable: true, className: "whitespace-nowrap" };
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
/** Cuántas tandas distintas hay (en PVC un registro es un pedido de una tanda: la tanda se cuenta una sola vez). */
const tandasDe = (rs: RegistroPlanilla[]) => new Set(rs.map((r) => r.fila_id ?? r.id));
/** Fotos sin duplicar: las de cada tanda se cuentan una vez aunque la tanda salga en varias filas. */
const fotosDe = (rs: RegistroPlanilla[]) => {
  const porTanda = new Map<string, number>();
  for (const r of rs) porTanda.set(r.fila_id ?? r.id, r.fotos);
  return [...porTanda.values()].reduce((s, n) => s + n, 0);
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
  LIJADO: [COL_FECHA, COL_ESTACION, COL_PEDIDO, COL_INICIO, COL_FIN, COL_PIEZAS, COL_OPERARIOS, COL_OBS, COL_ESTADO],
  ENCOLADO: [COL_FECHA, COL_ESTACION, COL_PEDIDO, COL_INICIO, COL_FIN, COL_PIEZAS, COL_OPERARIOS, COL_OBS, COL_ESTADO],
  PVC: [
    COL_FECHA,
    COL_ESTACION,
    { key: "mesa", label: "Mesa", value: (r) => etiquetaMesa(r.mesa_tamano, r.mesa_cantidad), filtrable: true, className: "whitespace-nowrap" },
    COL_PEDIDO,
    { ...COL_PIEZAS, label: "Piezas del pedido" },
    { key: "piezas_tanda", label: "Piezas de la tanda", value: (r) => v(r.piezas_tanda), filtrable: true, align: "right" },
    { key: "colores", label: "Color", value: (r) => v(r.colores), filtrable: true },
    COL_INICIO,
    COL_FIN,
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

function TablaEstacion({
  estacion,
  registros,
  abrible,
  seleccion,
  setSeleccion,
}: {
  estacion: Estacion;
  registros: RegistroPlanilla[];
  /** ¿Puede abrir la planilla de esa estación de trabajo? */
  abrible: (r: RegistroPlanilla) => boolean;
  seleccion: Seleccion;
  setSeleccion: (fn: (s: Seleccion) => Seleccion) => void;
}) {
  const columnas = COLUMNAS[estacion];
  const filtrables = columnas.filter((c) => c.filtrable);

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
  const pvc = estacion === "PVC";
  const piezas = filas.reduce((s, r) => s + (r.cantidad_piezas ?? 0), 0);
  const piezasTotal = registros.reduce((s, r) => s + (r.cantidad_piezas ?? 0), 0);
  // En PVC se cuentan tandas (no filas pedido-tanda); las fotos y las piezas no se duplican.
  const nFilas = pvc ? tandasDe(filas).size : filas.length;
  const nTotal = pvc ? tandasDe(registros).size : registros.length;
  const filtrado = filas.length !== registros.length;
  const unidad = pvc ? "tanda" : "registro";

  return (
    <section id={slugEstacion(estacion)} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {ETIQUETA_ESTACION[estacion]}{" "}
          <span className="text-sm font-normal text-muted-foreground" aria-live="polite">
            {filtrado ? `${nFilas} de ${nTotal} ${unidad}s` : `${nTotal} ${unidad}${nTotal === 1 ? "" : "s"}`}
            {" · "}
            {filtrado ? `${piezas} de ${piezasTotal} piezas` : `${piezasTotal} pieza${piezasTotal === 1 ? "" : "s"}`}
            {pvc && fotosDe(registros) > 0 && ` · ${filtrado ? `${fotosDe(filas)} de ${fotosDe(registros)}` : fotosDe(registros)} fotos`}
          </span>
        </h2>
        {activos > 0 && (
          <Button size="sm" variant="ghost" onClick={() => setSeleccion(() => ({}))}>
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
                  {abrible(r) && (
                    <>
                      {" · "}
                      <Link href={rutaPlanilla(r.estacion, r.estacion_trabajo.id, r.fecha)} className="text-sm underline-offset-4 hover:underline">
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

const MS_SALIDA = 200;

/** `estacionesAbribles`: ids de las estaciones de trabajo cuyas planillas puede abrir el usuario (`todas` = técnica/admin, cualquiera). */
export function RegistrosPlanillas({
  registros,
  abribles,
  estacionesAbribles,
  todas,
  estaciones,
}: {
  registros: RegistroPlanilla[];
  abribles: Estacion[];
  estacionesAbribles: string[];
  todas: boolean;
  estaciones: Estacion[];
}) {
  const porEstacion = useMemo(
    () => Object.fromEntries(estaciones.map((e) => [e, registros.filter((r) => r.estacion === e)])) as Record<Estacion, RegistroPlanilla[]>,
    [registros, estaciones],
  );
  // Se muestra una sola tabla por vez. Al cambiar, la anterior sale deslizándose y la nueva entra desde el lado
  // correspondiente (según el orden del proceso). Los filtros de cada tabla se conservan al ir y volver.
  const [activa, setActiva] = useState<Estacion>(estaciones[0]);
  const [saliente, setSaliente] = useState<Estacion | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const [selecciones, setSelecciones] = useState<Partial<Record<Estacion, Seleccion>>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  function elegir(e: Estacion) {
    if (e === activa) return;
    setDir(estaciones.indexOf(e) > estaciones.indexOf(activa) ? 1 : -1);
    setSaliente(activa);
    setActiva(e);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaliente(null), MS_SALIDA);
  }

  const tabla = (e: Estacion) => (
    <TablaEstacion
      estacion={e}
      registros={porEstacion[e]}
      abrible={(r) => abribles.includes(e) && (todas || estacionesAbribles.includes(r.estacion_trabajo.id))}
      seleccion={selecciones[e] ?? {}}
      setSeleccion={(fn) => setSelecciones((p) => ({ ...p, [e]: fn(p[e] ?? {}) }))}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      {estaciones.length > 1 && (
        <div role="tablist" aria-label="Planillas" className="flex flex-wrap gap-2">
          {estaciones.map((e) => (
            <button
              key={e}
              type="button"
              role="tab"
              aria-selected={e === activa}
              onClick={() => elegir(e)}
              className={`inline-flex h-11 items-center rounded-full border px-5 text-base font-medium transition active:scale-[0.98] lg:h-9 lg:px-4 lg:text-sm ${
                e === activa ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
            >
              {ETIQUETA_ESTACION[e]} ({e === "PVC" ? tandasDe(porEstacion[e]).size : porEstacion[e].length})
            </button>
          ))}
        </div>
      )}
      {/* Las dos tablas comparten la misma celda mientras dura la transición; overflow-x-clip evita la barra horizontal de la página. */}
      <div className="grid overflow-x-clip" style={{ "--dir": dir } as CSSProperties}>
        {saliente && (
          <div key={`sale-${saliente}`} className="tabla-sale col-start-1 row-start-1 min-w-0" aria-hidden>
            {tabla(saliente)}
          </div>
        )}
        <div key={`entra-${activa}`} className={`col-start-1 row-start-1 min-w-0 ${saliente ? "tabla-entra" : ""}`} role="tabpanel">
          {tabla(activa)}
        </div>
      </div>
    </div>
  );
}
