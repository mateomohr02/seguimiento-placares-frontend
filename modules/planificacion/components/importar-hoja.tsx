"use client";

import { useState } from "react";
import { CheckIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/loading-dots";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fechaCorta } from "@/modules/planilla/lib/estaciones";
import { type EstadoFilaImportada, type FilaImportada, type HojaImportada, type PedidoElegible } from "../types/planificacion.types";
import { contar, textoConteo } from "../lib/importar";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const nombreDia = (iso: string) => `${DIAS[(new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7]} ${fechaCorta(iso).slice(0, 5)}`;

const ESTADOS: Record<EstadoFilaImportada, { texto: string; clase: string }> = {
  OK: { texto: "OK", clase: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  SIN_PEDIDO: { texto: "Sin pedido encontrado", clase: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  DUPLICADA: { texto: "Duplicada (no se carga)", clase: "bg-muted text-muted-foreground" },
  INVALIDA: { texto: "Inválida (no se carga)", clase: "bg-destructive/15 text-destructive" },
};

// N° TW editable de una fila sin pedido (o inválida): «Verificar» consulta la app (coincidencia exacta). Si hay pedido, la fila queda asociada;
// si no, queda «sin pedido» con el N° corregido.
function CorregirNTw({ fila, onFila }: { fila: FilaImportada; onFila: (f: FilaImportada) => void }) {
  const [borrador, setBorrador] = useState(fila.n_tw);
  const [verificando, setVerificando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const sinCambios = borrador.trim() === fila.n_tw && fila.estado !== "INVALIDA";

  async function verificar() {
    const nTw = borrador.trim();
    if (!nTw) return setMensaje({ ok: false, texto: "Escribí el N° TW." });
    if (/\s/.test(nTw)) return setMensaje({ ok: false, texto: "El N° TW no puede tener espacios." });
    setVerificando(true);
    setMensaje(null);
    try {
      const res = await fetch(`/planificacion-api/pedido?n_tw=${encodeURIComponent(nTw)}`);
      const json = (await res.json().catch(() => null)) as { data?: PedidoElegible | null; message?: string } | null;
      if (!res.ok) return setMensaje({ ok: false, texto: json?.message ?? "No se pudo verificar el N° TW." });
      const hallado = json?.data ?? null;
      if (hallado) {
        onFila({ ...fila, n_tw: hallado.codigo_pedido, estado: "OK", pedido: { pedido_id: hallado.pedido_id, n_orden: hallado.n_orden }, avisos: [] });
        setMensaje({ ok: true, texto: `Pedido encontrado (orden ${hallado.n_orden ?? "—"}).` });
      } else {
        onFila({ ...fila, n_tw: nTw, estado: "SIN_PEDIDO", pedido: null, avisos: fila.estado === "INVALIDA" ? [] : fila.avisos });
        setMensaje({ ok: false, texto: "No existe en la app." });
      }
    } catch {
      setMensaje({ ok: false, texto: "No se pudo comunicar con el servidor." });
    } finally {
      setVerificando(false);
    }
  }

  return (
    <div className="flex min-w-52 flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Input
          value={borrador}
          onChange={(e) => {
            setBorrador(e.target.value);
            setMensaje(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void verificar();
            }
          }}
          aria-label={`Corregir el N° TW de la fila ${fila.fila_excel}`}
          maxLength={60}
          autoComplete="off"
          className="h-11 w-36"
        />
        <Button type="button" variant="outline" className="h-11 px-3" disabled={verificando || sinCambios} onClick={verificar}>
          {verificando ? <LoadingDots /> : "Verificar"}
        </Button>
      </div>
      {mensaje && (
        <span role="status" className={`text-xs ${mensaje.ok ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
          {mensaje.texto}
        </span>
      )}
    </div>
  );
}

// Vista previa de una hoja: planificación de destino (o por qué se omite) y la tabla de filas con su estado y avisos.
export function ImportarHoja({ hoja, onHoja }: { hoja: HojaImportada; onHoja: (h: HojaImportada) => void }) {
  if (hoja.omitida || !hoja.planificacion) {
    return (
      <p className="flex items-start gap-2 rounded-lg border border-amber-500/60 bg-amber-500/10 p-3 text-sm">
        <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <span>
          La hoja <strong>«{hoja.nombre_hoja}»</strong> se omite: {hoja.motivo ?? "No hay una planificación con ese nombre."} No se carga nada de esta hoja.
        </span>
      </p>
    );
  }

  const calidad = hoja.planificacion.clave === "CALIDAD";
  const c = contar(hoja.filas);
  const cambiar = (nueva: FilaImportada) => {
    let filas = hoja.filas.map((f) => (f.clave === nueva.clave ? nueva : f));
    // Corregir un N° TW puede dejar dos filas iguales (mismo N° TW; en Calidad, el mismo día): la segunda no se carga.
    if (nueva.estado === "OK" || nueva.estado === "SIN_PEDIDO") {
      const repetida = filas.some((f) => f.clave !== nueva.clave && f.n_tw === nueva.n_tw && f.dia === nueva.dia && (f.estado === "OK" || f.estado === "SIN_PEDIDO"));
      if (repetida) filas = filas.map((f) => (f.clave === nueva.clave ? { ...f, estado: "DUPLICADA" as const, avisos: [...f.avisos, "El N° TW ya está en otra fila: se carga una sola vez."] } : f));
    }
    onHoja({ ...hoja, filas });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm">
          Planificación <strong>{hoja.planificacion.nombre}</strong>
        </p>
        <p className="text-sm font-medium">{c.total === 0 ? "Sin filas con datos." : textoConteo(c)}</p>
      </div>
      {hoja.existente.filas > 0 && (
        <p className="text-sm text-muted-foreground">
          Esa semana la planificación ya tiene {hoja.existente.filas} {hoja.existente.filas === 1 ? "fila" : "filas"}: te lo pregunto en el paso 3.
        </p>
      )}
      {c.total > 0 && (
        <div className="max-h-[48dvh] overflow-auto rounded-lg border">
          <Table className="[&_td]:py-1.5">
            <TableHeader>
              <TableRow>
                <TableHead>Fila</TableHead>
                {calidad && <TableHead>Día</TableHead>}
                <TableHead>Cliente</TableHead>
                <TableHead>N° TW</TableHead>
                <TableHead>Modelo</TableHead>
                {calidad ? (
                  <TableHead>Módulos</TableHead>
                ) : (
                  <>
                    <TableHead>Color</TableHead>
                    <TableHead>Compromiso</TableHead>
                  </>
                )}
                <TableHead>Observaciones</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hoja.filas.map((f) => {
                const editable = f.estado === "SIN_PEDIDO" || f.estado === "INVALIDA";
                const excluida = f.estado === "DUPLICADA" || f.estado === "INVALIDA";
                const e = ESTADOS[f.estado];
                return (
                  <TableRow key={f.clave} className={excluida ? "opacity-70" : undefined}>
                    <TableCell className="text-muted-foreground">{f.fila_excel}</TableCell>
                    {calidad && <TableCell className="whitespace-nowrap">{f.dia ? nombreDia(f.dia) : "—"}</TableCell>}
                    <TableCell className="max-w-44 truncate" title={f.cliente}>
                      {f.cliente || "—"}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {editable ? <CorregirNTw key={`${f.clave}-${f.estado}`} fila={f} onFila={cambiar} /> : f.n_tw || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{f.modelo || "—"}</TableCell>
                    {calidad ? (
                      <TableCell>{f.modulos === null ? "—" : f.modulos}</TableCell>
                    ) : (
                      <>
                        <TableCell className="whitespace-nowrap">{f.color || "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">{f.compromiso ? fechaCorta(f.compromiso) : "—"}</TableCell>
                      </>
                    )}
                    <TableCell className="max-w-40 truncate" title={f.observaciones}>
                      {f.observaciones || "—"}
                    </TableCell>
                    <TableCell className="min-w-44">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${e.clase}`}>
                        {f.estado === "OK" && <CheckIcon className="size-3" />}
                        {e.texto}
                      </span>
                      {f.estado === "OK" && f.ya_existe && <span className="ml-1.5 text-xs text-muted-foreground">ya cargada</span>}
                      {f.avisos.map((a, i) => (
                        <span key={i} className="mt-0.5 block text-xs text-muted-foreground">
                          {a}
                        </span>
                      ))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
