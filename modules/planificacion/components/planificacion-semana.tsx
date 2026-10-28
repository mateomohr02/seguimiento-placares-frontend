"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, MessageSquareIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilaOrdenable, ListaOrdenable, useOrdenOptimista } from "@/components/filas-ordenables";
import { enviarOrden } from "@/lib/api/enviar-orden";
import { fechaCorta } from "@/modules/planilla/lib/estaciones";
import { colorDe, textoSobre } from "../lib/colores";
import { eliminarItemAction, marcarEstadoAction } from "../actions/planificacion.actions";
import { ETIQUETA_TIPO, type EstacionPlanificacion, type ItemPlanificacion, type SemanaPlanificacion, type TipoPlanificacion } from "../types/planificacion.types";
import { BuscadorPedido } from "./buscador-pedido";
import { FiltroCompromiso, SIN_FECHA, opcionesDeFecha } from "./filtro-compromiso";
import { ItemDialog } from "./item-dialog";
import { ObservacionesCelda } from "./observaciones-celda";

const DIA_MS = 86_400_000;
const mas = (iso: string, dias: number) => new Date(new Date(`${iso}T00:00:00Z`).getTime() + dias * DIA_MS).toISOString().slice(0, 10);
const v = (x: string | null) => (x === null || x === "" ? "—" : x);
const f = (x: string | null) => (x ? fechaCorta(x) : "—");
const hora = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" });
const SELECT =
  "h-11 rounded-lg border border-input bg-background px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

const href = (estacionId: string, semana?: string) => `/planificacion?estacion=${encodeURIComponent(estacionId)}${semana ? `&semana=${semana}` : ""}`;

// Cliente y N° TW van al pedido; N° orden va a la orden.
function LinkPedido({ item, children, className }: { item: ItemPlanificacion; children: React.ReactNode; className?: string }) {
  if (!item.pedido_id) return <span className={className}>{children}</span>;
  return (
    <Link href={`/pedidos/${item.pedido_id}`} className={`hover:underline ${className ?? ""}`}>
      {children}
    </Link>
  );
}

// Estados marcados en una fila (en una línea; quién y cuándo en el tooltip) y un botón por cada estado que el usuario puede marcar o quitar.
function Estados({ item, data }: { item: ItemPlanificacion; data: SemanaPlanificacion }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {item.marcas.map((m) => (
        <span
          key={m.estado_id}
          title={`${m.estado}: ${hora.format(new Date(m.marcado_en))} · ${m.marcado_por}`}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
          style={{ backgroundColor: colorDe(m.color), color: textoSobre(colorDe(m.color)) }}
        >
          <CheckIcon className="size-3.5" /> {m.estado}
          <span className="font-normal opacity-80">
            · {hora.format(new Date(m.marcado_en))} · {m.marcado_por}
          </span>
        </span>
      ))}
      {data.mis_estados.map((mio) => {
        const marcadoPorMi = item.marcas.some((m) => m.estado_id === mio.id);
        const varios = data.mis_estados.length > 1;
        return (
          <ConfirmActionButton
            key={mio.id}
            variant={marcadoPorMi ? "outline" : "default"}
            className="h-11 px-3"
            label={marcadoPorMi ? (varios ? `Quitar «${mio.nombre}»` : "Quitar marca") : `Marcar «${mio.nombre}»`}
            title={marcadoPorMi ? `¿Quitar «${mio.nombre}»?` : `¿Marcar «${mio.nombre}»?`}
            description={
              <>
                {marcadoPorMi ? "Se quita la marca de" : "Se marca como"} «{mio.nombre}»: {item.codigo_pedido}.
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

// Observaciones en una línea (la de técnica, recortada) y un botón que abre el detalle con todas, el historial y el alta.
function ObservacionesResumen({ item }: { item: ItemPlanificacion }) {
  const vigentes = item.comentarios.filter((c) => c.eliminado_en === null).length;
  return (
    <div className="flex items-center gap-2">
      <span className="max-w-44 truncate text-sm" title={item.observaciones ?? undefined}>
        {item.observaciones ?? <span className="text-muted-foreground">—</span>}
      </span>
      <Dialog>
        <DialogTrigger
          render={
            <Button size="sm" variant="outline" className="h-11 gap-1.5 px-3" aria-label={`Ver observaciones (${vigentes} de usuarios)`} title="Ver y agregar observaciones">
              <MessageSquareIcon /> {vigentes > 0 ? vigentes : "Ver"}
            </Button>
          }
        />
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Observaciones — {item.codigo_pedido}</DialogTitle>
            <DialogDescription>{item.cliente ?? "Sin cliente"}</DialogDescription>
          </DialogHeader>
          <ObservacionesCelda item={item} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Acciones({ item, estacion, semana }: { item: ItemPlanificacion; estacion: EstacionPlanificacion; semana: string }) {
  return (
    <div className="flex items-center gap-1">
      <ItemDialog
        estacionId={estacion.id}
        tipo={item.tipo}
        semana={semana}
        item={item}
        trigger={
          <Button size="sm" variant="outline" className="size-11" aria-label="Editar fila" title="Editar fila">
            <PencilIcon />
          </Button>
        }
      />
      <ConfirmActionButton
        variant="destructive"
        className="size-11"
        ariaLabel="Quitar fila"
        label={<Trash2Icon />}
        title="¿Quitar la fila?"
        description={<>Se quita «{item.codigo_pedido}» de la planificación, con sus marcas.</>}
        confirmLabel="Quitar"
        successMessage="Fila quitada."
        errorTitle="No se pudo quitar la fila"
        run={() => eliminarItemAction(item.id)}
      />
    </div>
  );
}

function Tabla({
  tipo,
  data,
  puedeGestionar,
  itemResaltado,
}: {
  tipo: TipoPlanificacion;
  data: SemanaPlanificacion;
  puedeGestionar: boolean;
  itemResaltado: string | null;
}) {
  const filas = data.items.filter((i) => i.tipo === tipo).sort((a, b) => a.orden - b.orden);
  const { ordenados, mover } = useOrdenOptimista(filas, (ids) =>
    enviarOrden("/planificacion-api/reordenar", { estacion_id: data.estacion.id, semana: data.semana_inicio, tipo, ids }),
  );
  const [filtroFecha, setFiltroFecha] = useState<Set<string> | null>(null);
  const opcionesFecha = opcionesDeFecha(filas.map((i) => i.compromiso));
  // Si cambia la semana y ya no existen las fechas filtradas, no queda nada que mostrar: se ignora el filtro.
  const filtroVigente = filtroFecha && opcionesFecha.some((o) => filtroFecha.has(o.clave)) ? filtroFecha : null;
  const visibles = filtroVigente ? ordenados.filter((i) => filtroVigente.has(i.compromiso ?? SIN_FECHA)) : ordenados;
  // Reordenar con filtro activo no tiene sentido (el orden es de toda la lista): sin asas mientras haya filtro.
  const puedeOrdenar = puedeGestionar && !filtroVigente;
  const reclamos = tipo === "RECLAMOS";
  const columnas = (reclamos ? 10 : 8) + (puedeGestionar ? 2 : 0);
  const resaltada = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    resaltada.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [itemResaltado]);

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
            estacionId={data.estacion.id}
            tipo={tipo}
            semana={data.semana_inicio}
            trigger={
              <Button variant="outline" className="h-11 px-4">
                <PlusIcon /> Agregar
              </Button>
            }
          />
        )}
      </div>
      {filtroVigente && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          Filtro de compromiso activo: se muestran {visibles.length} de {filas.length}. Para reordenar hay que quitar el filtro.
          <Button size="sm" variant="outline" className="h-9 px-3" onClick={() => setFiltroFecha(null)}>
            Quitar filtro
          </Button>
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border">
        <Table className="[&_td]:py-1">
          <TableHeader>
            <TableRow>
              {puedeGestionar && <TableHead className="w-14" />}
              <TableHead>Cliente</TableHead>
              {reclamos && <TableHead>Distribuidor</TableHead>}
              {reclamos && <TableHead>Ticket</TableHead>}
              <TableHead>N° TW</TableHead>
              <TableHead>Estado</TableHead>
              {!reclamos && <TableHead>N° Orden</TableHead>}
              {reclamos ? <TableHead>Tipo</TableHead> : <TableHead>Modelo</TableHead>}
              <TableHead>Color</TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1">
                  Compromiso
                  <FiltroCompromiso opciones={opcionesFecha} seleccion={filtroVigente} onChange={setFiltroFecha} />
                </span>
              </TableHead>
              {reclamos && <TableHead>Finalizado</TableHead>}
              <TableHead>Observaciones</TableHead>
              {puedeGestionar && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.length === 0 && (
              <TableRow>
                <TableCell colSpan={columnas} className="py-8 text-center text-muted-foreground">
                  {ordenados.length > 0
                    ? "Ninguna fila coincide con el filtro."
                    : reclamos
                      ? "No hay reclamos cargados para esta semana."
                      : "No hay pedidos cargados para esta semana."}
                </TableCell>
              </TableRow>
            )}
            <ListaOrdenable ids={visibles.map((i) => i.id)} onMover={mover}>
              {visibles.map((i) => {
                const completo = data.estados.length > 0 && data.estados.every((e) => i.marcas.some((m) => m.estado_id === e.id));
                const esResaltada = i.id === itemResaltado;
                return (
                  <FilaOrdenable
                    key={i.id}
                    id={i.id}
                    habilitado={puedeOrdenar}
                    className={esResaltada ? "outline-2 -outline-offset-2 outline-gold" : undefined}
                    style={i.marcas.length > 0 ? { backgroundColor: `${colorDe(i.marcas[i.marcas.length - 1].color)}${completo ? "2e" : "1a"}` } : undefined}
                    rowProps={{ ref: esResaltada ? resaltada : undefined, id: `fila-${i.id}` }}
                  >
                    {(asa) => (
                      <>
                        {puedeGestionar && <TableCell className="w-14">{asa}</TableCell>}

                        <TableCell className="max-w-48 font-medium">
                          <LinkPedido item={i} className="block truncate">
                            <span title={i.cliente ?? undefined}>{v(i.cliente)}</span>
                          </LinkPedido>
                        </TableCell>
                        {reclamos && <TableCell className="max-w-36 truncate">{v(i.distribuidor)}</TableCell>}
                        {reclamos && <TableCell className="whitespace-nowrap">{v(i.ticket)}</TableCell>}
                        <TableCell className="font-medium whitespace-nowrap">
                          <LinkPedido item={i}>{i.codigo_pedido}</LinkPedido>
                        </TableCell>
                        <TableCell className="min-w-40">
                          <Estados item={i} data={data} />
                        </TableCell>
                        {!reclamos && (
                          <TableCell className="whitespace-nowrap">
                            {i.orden_id && i.n_orden ? (
                              <Link href={`/ordenes/${i.orden_id}`} className="hover:underline">
                                {i.n_orden}
                              </Link>
                            ) : (
                              v(i.n_orden)
                            )}
                          </TableCell>
                        )}
                        {reclamos ? (
                          <TableCell className="max-w-44 truncate" title={i.tipo_reclamo ?? undefined}>
                            {v(i.tipo_reclamo)}
                          </TableCell>
                        ) : (
                          <TableCell className="whitespace-nowrap">{v(i.modelo)}</TableCell>
                        )}
                        <TableCell className="whitespace-nowrap">{v(i.color)}</TableCell>
                        <TableCell className="whitespace-nowrap">{f(i.compromiso)}</TableCell>
                        {reclamos && <TableCell className="whitespace-nowrap">{f(i.finalizado_en)}</TableCell>}
                        <TableCell>
                          <ObservacionesResumen item={i} />
                        </TableCell>
                        {puedeGestionar && (
                          <TableCell>
                            <Acciones item={i} estacion={data.estacion} semana={data.semana_inicio} />
                          </TableCell>
                        )}
                      </>
                    )}
                  </FilaOrdenable>
                );
              })}
            </ListaOrdenable>
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

// Planificación de una semana de una estación (pedidos y reclamos) con el marcado de estados de producción.
export function PlanificacionSemana({
  data,
  estaciones,
  puedeGestionar,
  semanaActual,
  itemResaltado,
}: {
  data: SemanaPlanificacion;
  estaciones: EstacionPlanificacion[];
  puedeGestionar: boolean;
  semanaActual: string;
  itemResaltado: string | null;
}) {
  const est = data.estacion.id;
  const anterior = mas(data.semana_inicio, -7);
  const siguiente = mas(data.semana_inicio, 7);
  const esActual = data.semana_inicio === semanaActual;
  const otras = data.semanas.filter((s) => s !== data.semana_inicio);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Planificación semanal — {data.estacion.nombre}</h1>
          <p className="text-sm text-muted-foreground">Pedidos y reclamos de la semana que carga la oficina técnica.</p>
        </div>
        <BuscadorPedido estacionId={est} />
      </div>

      {estaciones.length > 1 && (
        <nav aria-label="Estación de trabajo" className="flex flex-wrap gap-2">
          {estaciones.map((e) => (
            <Link
              key={e.id}
              href={href(e.id)}
              aria-current={e.id === est ? "page" : undefined}
              className={`inline-flex h-11 items-center rounded-lg border px-4 text-sm font-medium ${e.id === est ? "border-transparent bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {e.nombre}
            </Link>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Link href={href(est, anterior)} aria-label="Semana anterior" className="inline-flex size-11 items-center justify-center rounded-lg border hover:bg-muted">
          <ChevronLeftIcon />
        </Link>
        <div className="flex min-w-0 flex-col px-1">
          <span className="text-lg leading-tight font-semibold">
            Semana del {fechaCorta(data.semana_inicio)} al {fechaCorta(mas(data.semana_inicio, 4))}
          </span>
          {esActual && <span className="text-xs font-medium text-gold">Esta semana</span>}
        </div>
        <Link href={href(est, siguiente)} aria-label="Semana siguiente" className="inline-flex size-11 items-center justify-center rounded-lg border hover:bg-muted">
          <ChevronRightIcon />
        </Link>
        {!esActual && (
          <Link href={href(est)} className="inline-flex h-11 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted">
            Ir a esta semana
          </Link>
        )}
        {otras.length > 0 && (
          <form action="/planificacion" method="get" className="ml-auto">
            <input type="hidden" name="estacion" value={est} />
            <select
              name="semana"
              defaultValue=""
              aria-label="Ir a otra semana con planificación"
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className={SELECT}
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

      <Tabla tipo="PEDIDOS" data={data} puedeGestionar={puedeGestionar} itemResaltado={itemResaltado} />
      <Tabla tipo="RECLAMOS" data={data} puedeGestionar={puedeGestionar} itemResaltado={itemResaltado} />
    </div>
  );
}
