"use client";

import Link from "next/link";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fechaCorta } from "@/modules/planilla/lib/estaciones";
import { colorDe, textoSobre } from "../lib/colores";
import { eliminarItemAction, marcarEstadoAction } from "../actions/planificacion.actions";
import { ETIQUETA_TIPO, type ItemPlanificacion, type SemanaPlanificacion, type TipoPlanificacion } from "../types/planificacion.types";
import { ItemDialog } from "./item-dialog";
import { ObservacionesCelda } from "./observaciones-celda";

const DIA_MS = 86_400_000;
const mas = (iso: string, dias: number) => new Date(new Date(`${iso}T00:00:00Z`).getTime() + dias * DIA_MS).toISOString().slice(0, 10);
const v = (x: string | null) => (x === null || x === "" ? "—" : x);
const f = (x: string | null) => (x ? fechaCorta(x) : "—");
const hora = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" });

// Estados marcados en una fila y, para quien está en estaciones con estado, un botón por cada estado que puede marcar o quitar.
function Estados({ item, data }: { item: ItemPlanificacion; data: SemanaPlanificacion }) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      {item.marcas.map((m) => (
        <div key={m.estado_id} className="flex flex-col items-start leading-tight">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
            style={{ backgroundColor: colorDe(m.color), color: textoSobre(colorDe(m.color)) }}
          >
            <CheckIcon className="size-3.5" /> {m.estado}
          </span>
          <span className="pt-0.5 pl-1 text-xs text-muted-foreground">
            {hora.format(new Date(m.marcado_en))} · {m.marcado_por}
          </span>
        </div>
      ))}
      {data.mis_estados.map((mio) => {
        const marcadoPorMi = item.marcas.some((m) => m.estado_id === mio.id);
        const varios = data.mis_estados.length > 1;
        return (
          <ConfirmActionButton
            key={mio.id}
            variant={marcadoPorMi ? "outline" : "default"}
            label={marcadoPorMi ? (varios ? `Quitar «${mio.nombre}»` : "Quitar marca") : `Marcar «${mio.nombre}»`}
            title={marcadoPorMi ? `¿Quitar «${mio.nombre}»?` : `¿Marcar «${mio.nombre}»?`}
            description={
              <>
                {marcadoPorMi ? "Se quita la marca de" : "Se marca como"} «{mio.nombre}»: {item.n_tw || item.cliente}.
              </>
            }
            successMessage={marcadoPorMi ? "Marca quitada." : "Estado marcado."}
            errorTitle="No se pudo cambiar el estado"
            run={() => marcarEstadoAction(item.id, !marcadoPorMi, mio.id)}
          />
        );
      })}
    </div>
  );
}

function Acciones({ item, semana }: { item: ItemPlanificacion; semana: string }) {
  return (
    <div className="flex items-center gap-1">
      <ItemDialog
        tipo={item.tipo}
        semana={semana}
        item={item}
        trigger={
          <Button size="sm" variant="outline" aria-label="Editar fila" title="Editar fila">
            <PencilIcon />
          </Button>
        }
      />
      <ConfirmActionButton
        variant="destructive"
        ariaLabel="Quitar fila"
        label={<Trash2Icon />}
        title="¿Quitar la fila?"
        description={<>Se quita «{item.n_tw || item.cliente}» de la planificación, con sus marcas.</>}
        confirmLabel="Quitar"
        successMessage="Fila quitada."
        errorTitle="No se pudo quitar la fila"
        run={() => eliminarItemAction(item.id)}
      />
    </div>
  );
}

function Tabla({ tipo, data, puedeGestionar }: { tipo: TipoPlanificacion; data: SemanaPlanificacion; puedeGestionar: boolean }) {
  const filas = data.items.filter((i) => i.tipo === tipo);
  const reclamos = tipo === "RECLAMOS";
  const columnas = reclamos ? 11 : 10;

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {ETIQUETA_TIPO[tipo]} <span className="text-sm font-normal text-muted-foreground">({filas.length})</span>
        </h2>
        {filas.length > 0 && data.estados.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {data.estados.map((e) => `${e.nombre}: ${filas.filter((i) => i.marcas.some((m) => m.estado_id === e.id)).length} de ${filas.length}`).join(" · ")}
          </p>
        )}
        {puedeGestionar && (
          <ItemDialog
            tipo={tipo}
            semana={data.semana_inicio}
            trigger={
              <Button variant="outline" className="h-10 px-4">
                <PlusIcon /> Agregar
              </Button>
            }
          />
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              {reclamos && <TableHead>Distribuidor</TableHead>}
              {reclamos && <TableHead>Ticket</TableHead>}
              <TableHead>N° TW</TableHead>
              <TableHead>Estado</TableHead>
              {!reclamos && <TableHead>N° Orden</TableHead>}
              {reclamos ? <TableHead>Tipo</TableHead> : <TableHead>Modelo</TableHead>}
              <TableHead>Color</TableHead>
              {reclamos ? <TableHead>Compromiso</TableHead> : <TableHead>Fábrica</TableHead>}
              {reclamos ? <TableHead>Finalizado</TableHead> : <TableHead>Fecha límite</TableHead>}
              <TableHead>Observaciones</TableHead>
              {puedeGestionar && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.length === 0 && (
              <TableRow>
                <TableCell colSpan={columnas + (puedeGestionar ? 1 : 0)} className="py-8 text-center text-muted-foreground">
                  {reclamos ? "No hay reclamos cargados para esta semana." : "No hay pedidos cargados para esta semana."}
                </TableCell>
              </TableRow>
            )}
            {filas.map((i) => {
              const completo = data.estados.length > 0 && data.estados.every((e) => i.marcas.some((m) => m.estado_id === e.id));
              return (
                <TableRow key={i.id} style={i.marcas.length > 0 ? { backgroundColor: `${colorDe(i.marcas[i.marcas.length - 1].color)}${completo ? "2e" : "1a"}` } : undefined}>
                  <TableCell className="min-w-40 font-medium">{v(i.cliente)}</TableCell>
                  {reclamos && <TableCell>{v(i.distribuidor)}</TableCell>}
                  {reclamos && <TableCell className="whitespace-nowrap">{v(i.ticket)}</TableCell>}
                  <TableCell className="font-medium whitespace-nowrap">{v(i.n_tw)}</TableCell>
                  <TableCell className="min-w-44">
                    <Estados item={i} data={data} />
                  </TableCell>
                  {!reclamos && <TableCell>{v(i.n_orden)}</TableCell>}
                  {reclamos ? <TableCell className="min-w-40">{v(i.tipo_reclamo)}</TableCell> : <TableCell className="whitespace-nowrap">{v(i.modelo)}</TableCell>}
                  <TableCell className="whitespace-nowrap">{v(i.color)}</TableCell>
                  {reclamos ? <TableCell className="whitespace-nowrap">{f(i.compromiso)}</TableCell> : <TableCell className="whitespace-nowrap">{f(i.fabrica)}</TableCell>}
                  {reclamos ? <TableCell className="whitespace-nowrap">{f(i.finalizado_en)}</TableCell> : <TableCell className="whitespace-nowrap">{f(i.fecha_limite)}</TableCell>}
                  <TableCell className="min-w-56">
                    <ObservacionesCelda item={i} />
                  </TableCell>
                  {puedeGestionar && (
                    <TableCell>
                      <Acciones item={i} semana={data.semana_inicio} />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

// Planificación de una semana (pedidos y reclamos) con el marcado de estados de producción.
export function PlanificacionSemana({ data, puedeGestionar, semanaActual }: { data: SemanaPlanificacion; puedeGestionar: boolean; semanaActual: string }) {
  const anterior = mas(data.semana_inicio, -7);
  const siguiente = mas(data.semana_inicio, 7);
  const esActual = data.semana_inicio === semanaActual;
  const otras = data.semanas.filter((s) => s !== data.semana_inicio);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/planificacion?semana=${anterior}`} aria-label="Semana anterior" className="inline-flex size-11 items-center justify-center rounded-lg border hover:bg-muted">
          <ChevronLeftIcon />
        </Link>
        <div className="flex min-w-0 flex-col px-1">
          <span className="text-lg leading-tight font-semibold">
            Semana del {fechaCorta(data.semana_inicio)} al {fechaCorta(mas(data.semana_inicio, 4))}
          </span>
          {esActual && <span className="text-xs font-medium text-gold">Esta semana</span>}
        </div>
        <Link href={`/planificacion?semana=${siguiente}`} aria-label="Semana siguiente" className="inline-flex size-11 items-center justify-center rounded-lg border hover:bg-muted">
          <ChevronRightIcon />
        </Link>
        {!esActual && (
          <Link href="/planificacion" className="inline-flex h-11 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted">
            Ir a esta semana
          </Link>
        )}
        {otras.length > 0 && (
          <form action="/planificacion" method="get" className="ml-auto">
            <select
              name="semana"
              defaultValue=""
              aria-label="Ir a otra semana con planificación"
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="h-11 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                Otras semanas…
              </option>
              {otras.map((s) => (
                <option key={s} value={s}>
                  {fechaCorta(s)} al {fechaCorta(mas(s, 4))}
                </option>
              ))}
            </select>
          </form>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {data.mis_estados.length === 0 ? (
          "Ninguna de tus estaciones de trabajo tiene un estado de producción (o no estás en ninguna): podés ver la planificación pero no marcar. Pedile a técnica que te asigne a una estación con estado."
        ) : data.mis_estados.length === 1 ? (
          <>
            El estado de producción de tu estación es <strong>«{data.mis_estados[0].nombre}»</strong>: marcalo en cada pedido cuando termine en tu estación.
          </>
        ) : (
          <>
            Tus estaciones marcan estos estados de producción: {data.mis_estados.map((e, i) => (
              <span key={e.id}>
                {i > 0 && ", "}
                <strong>«{e.nombre}»</strong>
              </span>
            ))}
            . En cada pedido elegí cuál marcar (un botón por estado).
          </>
        )}
      </p>

      <Tabla tipo="PEDIDOS" data={data} puedeGestionar={puedeGestionar} />
      <Tabla tipo="RECLAMOS" data={data} puedeGestionar={puedeGestionar} />
    </div>
  );
}
