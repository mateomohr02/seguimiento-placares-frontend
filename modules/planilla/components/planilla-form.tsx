"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2Icon, CheckIcon, ClockIcon, LockIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/loading-dots";
import { ETIQUETA_ESTACION, fechaCorta, rutaPlanilla } from "../lib/estaciones";
import type { Estacion, EstadoPlanilla, FotoFila, OperarioDisponible, OperarioPlanilla, Planilla } from "../types/planilla.types";
import { FotosFila, subirFoto, type FotoPendiente } from "./fotos-fila";

// Formulario de una planilla de producción (Lijado, Encolado o PVC) de un día. Mientras
// es BORRADOR se guarda sola en el servidor (así no se pierde si se cierra la sesión);
// "Guardar planilla" la cierra, y una planilla guardada se puede corregir (el servidor
// conserva la versión previa). Diseño.md §14.

interface FilaForm {
  key: string;
  id?: string;
  hora_inicio: string;
  hora_fin: string;
  pedido_codigo: string;
  cantidad_piezas: string;
  observaciones: string;
  colocacion_pvc: string;
  perfilado: string;
  colores: string;
  mesa_chica: string;
  mesa_grande: string;
  fotos: FotoFila[];
  /** Fotos de un ítem que todavía no existe en el servidor: se suben solas al guardar. */
  pendientes: FotoPendiente[];
}

type CampoTexto = Exclude<keyof FilaForm, "key" | "id" | "fotos" | "pendientes">;

const AUTOSAVE_MS = 1200;
let contadorKey = 0;
const nuevaKey = () => `f${++contadorKey}`;

const vacia = (): FilaForm => ({
  key: nuevaKey(),
  hora_inicio: "",
  hora_fin: "",
  pedido_codigo: "",
  cantidad_piezas: "",
  observaciones: "",
  colocacion_pvc: "",
  perfilado: "",
  colores: "",
  mesa_chica: "",
  mesa_grande: "",
  fotos: [],
  pendientes: [],
});

const desdeServidor = (p: Planilla): FilaForm[] =>
  p.filas.map((f) => ({
    key: nuevaKey(),
    id: f.id,
    hora_inicio: f.hora_inicio ?? "",
    hora_fin: f.hora_fin ?? "",
    pedido_codigo: f.pedido_codigo,
    cantidad_piezas: f.cantidad_piezas === null ? "" : String(f.cantidad_piezas),
    observaciones: f.observaciones ?? "",
    colocacion_pvc: f.colocacion_pvc ?? "",
    perfilado: f.perfilado ?? "",
    colores: f.colores ?? "",
    mesa_chica: f.mesa_chica === null ? "" : String(f.mesa_chica),
    mesa_grande: f.mesa_grande === null ? "" : String(f.mesa_grande),
    fotos: f.fotos,
    pendientes: [],
  }));

const num = (s: string) => (s.trim() === "" ? null : Number(s));

// `operarios` son los ids de usuario de las personas elegidas (los nombres viejos sin usuario no se mandan: el servidor los conserva).
const hacerBody = (estado: EstadoPlanilla, operarios: string[], filas: FilaForm[]) => ({
  estado,
  operarios,
  filas: filas.map((f) => ({
    id: f.id,
    // Una hora a medio escribir no se manda (queda vacía) hasta que esté completa.
    hora_inicio: HORA_VALIDA.test(f.hora_inicio) ? f.hora_inicio : "",
    hora_fin: HORA_VALIDA.test(f.hora_fin) ? f.hora_fin : "",
    pedido_codigo: f.pedido_codigo,
    cantidad_piezas: num(f.cantidad_piezas),
    observaciones: f.observaciones,
    colocacion_pvc: f.colocacion_pvc,
    perfilado: f.perfilado,
    colores: f.colores,
    mesa_chica: num(f.mesa_chica),
    mesa_grande: num(f.mesa_grande),
  })),
});

const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/;

// Escribiendo solo números: "0610" → "06:10" (siempre 24 horas, sin AM/PM).
const formatearHora = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
};

const ahora = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/** Ids de las personas elegidas (los nombres viejos sin usuario no se mandan). */
const idsDe = (operarios: OperarioPlanilla[]) => operarios.flatMap((o) => (o.usuario_id ? [o.usuario_id] : []));

const fechaHora = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" });

interface Sugerencia {
  codigo: string;
  referencia: string | null;
}

export function PlanillaForm({
  tipo: estacion,
  estacionTrabajoId,
  fecha,
  inicial,
  colores,
}: {
  /** Tipo de planilla: Lijado, Encolado o PVC. */
  tipo: Estacion;
  estacionTrabajoId: string;
  fecha: string;
  /** La planilla del día; si todavía no existe llega «virtual» con la preselección de operarios que calcula el servidor. */
  inicial: Planilla;
  colores: string[];
}) {
  const router = useRouter();
  const [filas, setFilas] = useState<FilaForm[]>(() => (inicial.filas.length > 0 ? desdeServidor(inicial) : [vacia()]));
  const [estado, setEstado] = useState<EstadoPlanilla>(inicial.estado ?? "BORRADOR");
  // Los operarios son personas de la estación de trabajo. Vienen preseleccionados y con el bloqueo ya calculado por el servidor.
  const [operarios, setOperarios] = useState<OperarioPlanilla[]>(inicial.operarios);
  const [disponibles, setDisponibles] = useState<OperarioDisponible[]>(inicial.operarios_disponibles);
  const [puedeCambiarBloqueados, setPuedeCambiarBloqueados] = useState(inicial.puede_cambiar_bloqueados);
  const [actualizadaEn, setActualizadaEn] = useState<string | null>(inicial.id ? inicial.actualizado_en : null);
  const [modificadaPor, setModificadaPor] = useState<string | null>(inicial.id ? inicial.modificado_por : null);
  const [versiones, setVersiones] = useState(inicial.versiones?.length ?? 0);
  const [planillaId, setPlanillaId] = useState<string | null>(inicial.id || null);
  const [sucio, setSucio] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);

  const filasRef = useRef(filas);
  const operariosRef = useRef(operarios);
  const estadoRef = useRef(estado);
  const cambiosRef = useRef(0);
  const cola = useRef<Promise<unknown>>(Promise.resolve());
  const subidasRef = useRef(new Set<string>());
  const hayPendientes = filas.some((f) => f.pendientes.length > 0);
  const sugerirTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const esPvc = estacion === "PVC";

  useEffect(() => {
    filasRef.current = filas;
    operariosRef.current = operarios;
    estadoRef.current = estado;
  });

  // Sube las fotos que esperaban a que su ítem existiera. Las que fallan quedan pendientes y se reintentan al próximo guardado.
  const subirPendientes = useCallback(async (idPorKey: Map<string, string | undefined>) => {
    const lista = filasRef.current.flatMap((f) => f.pendientes.map((p) => ({ key: f.key, filaId: f.id ?? idPorKey.get(f.key), p })));
    for (const { key, filaId, p } of lista) {
      if (!filaId || subidasRef.current.has(p.id)) continue;
      subidasRef.current.add(p.id);
      const r = await subirFoto(filaId, p.blob);
      if ("error" in r) {
        subidasRef.current.delete(p.id);
        toast.error(`${r.error} La foto sigue en el equipo y se reintenta al guardar.`);
        return;
      }
      URL.revokeObjectURL(p.url);
      setFilas((prev) => prev.map((f) => (f.key === key ? { ...f, pendientes: f.pendientes.filter((x) => x.id !== p.id), fotos: [...f.fotos, r.foto] } : f)));
    }
  }, []);

  // Guarda el estado actual del formulario. Los guardados van de a uno (en cola) para que
  // una fila nueva reciba su id antes de que se mande otra vez y no se duplique.
  const guardar = useCallback(
    (destino: EstadoPlanilla): Promise<{ ok: true } | { ok: false; message: string }> => {
      const tarea = cola.current.then(async () => {
        const vistos = cambiosRef.current;
        const enviadas = filasRef.current;
        setGuardando(true);
        try {
          const res = await fetch(`/planillas-api/dia/${encodeURIComponent(estacionTrabajoId)}/${estacion}/${fecha}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(hacerBody(destino, idsDe(operariosRef.current), enviadas)),
          });
          const body = (await res.json().catch(() => null)) as { data?: Planilla; message?: string } | null;
          if (!res.ok || !body?.data) {
            const message = body?.message ?? "No se pudo guardar la planilla.";
            setError(message);
            return { ok: false as const, message };
          }
          const p = body.data;
          // La respuesta trae las filas en el mismo orden que se enviaron: se les asigna su id.
          const idPorKey = new Map(enviadas.map((f, i) => [f.key, p.filas[i]?.id]));
          setFilas((prev) => prev.map((f) => (f.id ? f : { ...f, id: idPorKey.get(f.key) })));
          setEstado(p.estado);
          // El servidor recalcula el bloqueo (quien ya figura en una planilla empezada queda bloqueado) y la lista de personas.
          if (cambiosRef.current === vistos) setOperarios(p.operarios);
          setDisponibles(p.operarios_disponibles);
          setPuedeCambiarBloqueados(p.puede_cambiar_bloqueados);
          setActualizadaEn(p.actualizado_en);
          setModificadaPor(p.modificado_por);
          setVersiones(p.versiones.length);
          setPlanillaId(p.id);
          setError(null);
          if (cambiosRef.current === vistos) setSucio(false);
          await subirPendientes(new Map(enviadas.map((f, i) => [f.key, p.filas[i]?.id])));
          return { ok: true as const };
        } catch {
          const message = "No se pudo comunicar con el servidor. Los cambios siguen en pantalla.";
          setError(message);
          return { ok: false as const, message };
        } finally {
          setGuardando(false);
        }
      });
      cola.current = tarea;
      return tarea;
    },
    [estacion, estacionTrabajoId, fecha, subirPendientes],
  );

  // Guardado automático del borrador.
  useEffect(() => {
    if (!sucio || estado !== "BORRADOR") return;
    const t = setTimeout(() => void guardar("BORRADOR"), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [sucio, estado, filas, operarios, guardar]);

  // Avisa antes de cerrar la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!sucio && !hayPendientes) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [sucio, hayPendientes]);

  const editar = useCallback((fn: (prev: FilaForm[]) => FilaForm[]) => {
    cambiosRef.current++;
    setSucio(true);
    setFilas(fn);
  }, []);

  function alternarOperario(o: OperarioDisponible) {
    const actual = operariosRef.current.find((x) => x.usuario_id === o.usuario_id);
    // Un operario bloqueado no se puede quitar (salvo técnica/admin al corregir).
    if (actual?.bloqueado && !puedeCambiarBloqueados) return;
    cambiosRef.current++;
    setSucio(true);
    setOperarios((prev) =>
      prev.some((x) => x.usuario_id === o.usuario_id)
        ? prev.filter((x) => x.usuario_id !== o.usuario_id)
        : [...prev, { usuario_id: o.usuario_id, nombre: o.nombre, bloqueado: false }],
    );
  }

  function setCampo(key: string, campo: CampoTexto, valor: string) {
    editar((prev) => prev.map((f) => (f.key === key ? { ...f, [campo]: valor } : f)));
  }

  function onPedido(key: string, valor: string) {
    const v = valor.toUpperCase();
    setCampo(key, "pedido_codigo", v);
    if (sugerirTimer.current) clearTimeout(sugerirTimer.current);
    if (v.trim().length < 2) return setSugerencias([]);
    sugerirTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/planillas-api/pedidos-sugeridos?q=${encodeURIComponent(v.trim())}`);
        const body = (await res.json()) as { data?: Sugerencia[] };
        setSugerencias(body.data ?? []);
      } catch {
        setSugerencias([]);
      }
    }, 250);
  }

  function quitar(f: FilaForm) {
    const nFotos = f.fotos.length + f.pendientes.length;
    if (nFotos > 0 && !window.confirm(`Este ítem tiene ${nFotos} foto(s). Si lo quitás dejan de verse en la planilla (en las que ya se subieron, queda copia en el historial). ¿Quitarlo?`)) return;
    f.pendientes.forEach((p) => URL.revokeObjectURL(p.url));
    editar((prev) => (prev.length > 1 ? prev.filter((x) => x.key !== f.key) : [vacia()]));
  }

  async function cerrar() {
    setError(null);
    if (operariosRef.current.length === 0) {
      setError("Tildá al menos un operario para guardar la planilla.");
      return;
    }
    const r = await guardar("GUARDADA");
    if (r.ok) {
      toast.success(estadoRef.current === "GUARDADA" && versiones > 0 ? "Cambios guardados." : "Planilla guardada.");
      router.refresh();
    }
  }

  async function cambiarFecha(nueva: string) {
    if (!nueva || nueva === fecha) return;
    if (sucio) {
      if (estado === "BORRADOR") {
        const r = await guardar("BORRADOR");
        if (!r.ok) return;
      } else if (!window.confirm("Hay cambios sin guardar en esta planilla. ¿Descartarlos y cambiar de fecha?")) {
        return;
      }
    }
    router.push(rutaPlanilla(estacion, estacionTrabajoId, nueva));
  }

  // Las fotos de un ítem nuevo esperan en el equipo y se suben solas cuando el ítem se guarda (borrador automático o botón).
  function agregarPendientes(key: string, items: FotoPendiente[]) {
    editar((prev) => prev.map((f) => (f.key === key ? { ...f, pendientes: [...f.pendientes, ...items] } : f)));
  }

  function quitarPendiente(key: string, id: string) {
    const p = filasRef.current.find((f) => f.key === key)?.pendientes.find((x) => x.id === id);
    if (p) URL.revokeObjectURL(p.url);
    editar((prev) => prev.map((f) => (f.key === key ? { ...f, pendientes: f.pendientes.filter((x) => x.id !== id) } : f)));
  }

  function setFotos(key: string, fotos: FotoFila[]) {
    setFilas((prev) => prev.map((f) => (f.key === key ? { ...f, fotos } : f)));
  }

  const total = filas.reduce((s, f) => {
    const n = esPvc ? (num(f.mesa_chica) ?? 0) + (num(f.mesa_grande) ?? 0) : (num(f.cantidad_piezas) ?? 0);
    return s + (Number.isFinite(n) ? n : 0);
  }, 0);
  const guardada = estado === "GUARDADA";
  // Los nombres viejos sin usuario (planillas anteriores a esta función) quedan como historia: se ven, no se tocan.
  const historicos = operarios.filter((o) => o.usuario_id === null);
  const bloqueadoPorId = new Map(operarios.filter((o) => o.usuario_id !== null).map((o) => [o.usuario_id, o.bloqueado] as const));
  const hayBloqueados = operarios.some((o) => o.bloqueado);
  const sinPersonas = disponibles.length === 0 && historicos.length === 0;

  return (
    <div className="flex flex-col gap-5 lg:gap-3">
      {/* Vertical: fecha y estado arriba, operarios abajo. Apaisado (lg): todo en una sola fila baja. */}
      <div className="grid grid-cols-[auto_1fr] items-end gap-x-4 gap-y-4 rounded-lg border p-4 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-y-0 lg:px-3 lg:py-2">
        <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
          <label htmlFor="planilla-fecha" className="text-sm font-medium">
            Fecha
          </label>
          <Input
            id="planilla-fecha"
            type="date"
            value={fecha}
            onChange={(e) => void cambiarFecha(e.target.value)}
            className="h-11 w-44 lg:h-10"
          />
        </div>
        <div
          role="group"
          aria-labelledby="planilla-operarios"
          className="col-span-2 row-start-2 flex min-w-0 flex-col gap-1 text-sm lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:flex-row lg:flex-wrap lg:items-center lg:gap-2"
        >
          <span id="planilla-operarios" className="font-medium">
            Operarios
          </span>
          {sinPersonas ? (
            <span className="text-muted-foreground">
              La estación «{inicial.estacion_trabajo.nombre}» todavía no tiene operarios. Pedile a técnica que asigne personas a la estación (Termolaminado &gt; Configurar).
            </span>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {disponibles.map((o) => {
                  const marcado = bloqueadoPorId.has(o.usuario_id);
                  const fijo = marcado && bloqueadoPorId.get(o.usuario_id) === true && !puedeCambiarBloqueados;
                  return (
                    <button
                      key={o.usuario_id}
                      type="button"
                      role="checkbox"
                      aria-checked={marcado}
                      aria-disabled={fijo || undefined}
                      title={fijo ? "Ya figura en esta planilla: no se puede quitar" : undefined}
                      onClick={() => alternarOperario(o)}
                      className={`inline-flex h-11 items-center gap-1.5 rounded-full border px-5 text-base font-medium transition lg:h-9 lg:px-4 lg:text-sm ${
                        marcado ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                      } ${fijo ? "cursor-not-allowed opacity-90" : "active:scale-[0.98]"}`}
                    >
                      {fijo ? <LockIcon className="size-4" aria-hidden /> : marcado && <CheckIcon className="size-4" aria-hidden />} {o.nombre}
                      {fijo && <span className="sr-only"> (bloqueado: ya figura en la planilla)</span>}
                    </button>
                  );
                })}
                {historicos.map((o) => (
                  <span
                    key={`h-${o.nombre}`}
                    title="Nombre de una planilla anterior: queda como historia"
                    className="inline-flex h-11 items-center gap-1.5 rounded-full border border-primary bg-primary px-5 text-base font-medium text-primary-foreground opacity-90 lg:h-9 lg:px-4 lg:text-sm"
                  >
                    <LockIcon className="size-4" aria-hidden /> {o.nombre}
                  </span>
                ))}
              </div>
              {hayBloqueados && !puedeCambiarBloqueados && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <LockIcon className="size-3" aria-hidden /> Los operarios con candado ya figuran en la planilla y no se pueden quitar.
                </span>
              )}
              {puedeCambiarBloqueados && <span className="text-xs text-muted-foreground">Como técnica podés cambiar todos los operarios, también los bloqueados.</span>}
            </>
          )}
          {!sinPersonas && <span className="text-xs text-muted-foreground lg:hidden">Tocá los operarios que trabajaron en esta planilla.</span>}
        </div>
        <div className="col-start-2 row-start-1 flex flex-col items-end gap-1 text-right text-sm lg:col-start-3 lg:gap-0.5">
          <Badge variant={guardada ? "default" : "secondary"}>{guardada ? "Guardada" : "Borrador"}</Badge>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {guardando ? (
              "Guardando…"
            ) : sucio ? (
              guardada ? (
                "Cambios sin guardar"
              ) : (
                "Se guarda sola en un momento…"
              )
            ) : actualizadaEn ? (
              <>
                {guardada ? "Guardada" : "Borrador guardado"} {fechaHora.format(new Date(actualizadaEn))}
                {modificadaPor ? ` · ${modificadaPor}` : ""}
              </>
            ) : (
              "Todavía no se guardó nada."
            )}
          </span>
        </div>
      </div>

      {guardada && (
        <p className="rounded-lg border border-gold/50 bg-gold/10 p-3 text-sm">
          Esta planilla ya está guardada. Podés corregirla y tocar <strong>Guardar cambios</strong>: se conserva la versión anterior
          {versiones > 0 && planillaId ? (
            <>
              {" "}
              (hay {versiones} corrección{versiones === 1 ? "" : "es"} previa{versiones === 1 ? "" : "s"};{" "}
              <Link className="underline" href={`/planillas/detalle/${planillaId}`}>
                ver historial
              </Link>
              )
            </>
          ) : (
            "."
          )}
        </p>
      )}

      <datalist id="sugerencias-pedidos">
        {sugerencias.map((s) => (
          <option key={s.codigo} value={s.codigo} label={s.referencia ?? undefined} />
        ))}
      </datalist>
      <datalist id="sugerencias-colores">
        {colores.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <ol className="flex flex-col gap-3">
        {filas.map((f, i) => (
          <li key={f.key} className="flex flex-col gap-3 rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">Ítem {i + 1}</span>
              <Button type="button" variant="ghost" size="sm" className="h-9" onClick={() => quitar(f)} aria-label={`Quitar ítem ${i + 1}`}>
                <Trash2Icon /> Quitar
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
              <Campo etiqueta="N° de pedido" className="col-span-2 lg:col-span-2">
                <Input
                  value={f.pedido_codigo}
                  onChange={(e) => onPedido(f.key, e.target.value)}
                  list="sugerencias-pedidos"
                  maxLength={40}
                  autoComplete="off"
                  autoCapitalize="characters"
                  placeholder="Ej. 26-02689"
                  className="h-11"
                />
              </Campo>
              <Campo etiqueta="Hora inicio">
                <HoraInput valor={f.hora_inicio} onChange={(v) => setCampo(f.key, "hora_inicio", v)} />
              </Campo>
              <Campo etiqueta="Hora fin">
                <HoraInput valor={f.hora_fin} onChange={(v) => setCampo(f.key, "hora_fin", v)} />
              </Campo>
              {esPvc ? (
                <>
                  <Campo etiqueta="Mesa chica">
                    <NumeroInput valor={f.mesa_chica} onChange={(v) => setCampo(f.key, "mesa_chica", v)} />
                  </Campo>
                  <Campo etiqueta="Mesa grande">
                    <NumeroInput valor={f.mesa_grande} onChange={(v) => setCampo(f.key, "mesa_grande", v)} />
                  </Campo>
                  <Campo etiqueta="Colores (código)" className="col-span-2 lg:col-span-2">
                    <Input
                      value={f.colores}
                      onChange={(e) => setCampo(f.key, "colores", e.target.value.toUpperCase().replace(/\./g, ""))}
                      list="sugerencias-colores"
                      maxLength={30}
                      autoComplete="off"
                      autoCapitalize="characters"
                      placeholder="Ej. NM"
                      className="h-11"
                    />
                  </Campo>
                  <Campo etiqueta="Colocación PVC" className="col-span-2 lg:col-span-2">
                    <Input
                      value={f.colocacion_pvc}
                      onChange={(e) => setCampo(f.key, "colocacion_pvc", e.target.value)}
                      maxLength={200}
                      autoComplete="off"
                      className="h-11"
                    />
                  </Campo>
                  <Campo etiqueta="Corte y perfilado" className="col-span-2 lg:col-span-2">
                    <Input
                      value={f.perfilado}
                      onChange={(e) => setCampo(f.key, "perfilado", e.target.value)}
                      maxLength={200}
                      autoComplete="off"
                      className="h-11"
                    />
                  </Campo>
                </>
              ) : (
                <Campo etiqueta="Cantidad de piezas" className="col-span-2 lg:col-span-2">
                  <NumeroInput valor={f.cantidad_piezas} onChange={(v) => setCampo(f.key, "cantidad_piezas", v)} />
                </Campo>
              )}
              <Campo etiqueta="Observaciones" className="col-span-2 lg:col-span-6">
                <Input
                  value={f.observaciones}
                  onChange={(e) => setCampo(f.key, "observaciones", e.target.value)}
                  maxLength={500}
                  autoComplete="off"
                  className="h-11"
                />
              </Campo>
            </div>

            {esPvc && (
              <FotosFila
                filaId={f.id}
                fotos={f.fotos}
                pendientes={f.pendientes}
                onCambio={(fotos) => setFotos(f.key, fotos)}
                onAgregarPendientes={(items) => agregarPendientes(f.key, items)}
                onQuitarPendiente={(id) => quitarPendiente(f.key, id)}
              />
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" className="h-11 px-4" onClick={() => editar((prev) => [...prev, vacia()])}>
          <PlusIcon /> Agregar ítem
        </Button>
        <span className="text-sm text-muted-foreground">
          {filas.length} ítem{filas.length === 1 ? "" : "s"} · {total} pieza{total === 1 ? "" : "s"}
        </span>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {!guardada && (
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <ClockIcon className="size-4" /> Mientras no la guardes queda como borrador ({ETIQUETA_ESTACION[estacion]} del {fechaCorta(fecha)}).
        </span>
      )}

      {/* Flota en la esquina inferior derecha mientras el formulario está en pantalla (sticky: no sale del área del formulario). */}
      <div className="pointer-events-none sticky bottom-4 z-20 self-end">
        <Button
          type="button"
          className="pointer-events-auto h-12 px-6 text-base shadow-lg"
          disabled={guardando || (guardada && !sucio && !hayPendientes)}
          onClick={() => void cerrar()}
        >
          {guardando ? <LoadingDots /> : <CheckCircle2Icon />} {guardada ? "Guardar cambios" : "Guardar planilla"}
        </Button>
      </div>
    </div>
  );
}

function Campo({ etiqueta, className, children }: { etiqueta: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className ?? ""}`}>
      <span className="font-medium">{etiqueta}</span>
      {children}
    </label>
  );
}

function NumeroInput({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <Input
      value={valor}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      inputMode="numeric"
      autoComplete="off"
      className="h-11"
    />
  );
}

function HoraInput({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const [tocado, setTocado] = useState(false);
  const invalida = tocado && valor !== "" && !HORA_VALIDA.test(valor);
  return (
    <div className="flex gap-1">
      <Input
        value={valor}
        onChange={(e) => onChange(formatearHora(e.target.value))}
        onBlur={() => setTocado(true)}
        inputMode="numeric"
        placeholder="HH:MM"
        maxLength={5}
        autoComplete="off"
        aria-invalid={invalida}
        aria-label="Hora (24 h)"
        className="h-11 min-w-0 text-center text-lg font-medium tabular-nums"
      />
      <Button
        type="button"
        variant="outline"
        className="h-11 shrink-0 px-3 text-sm lg:px-0 lg:w-11"
        onClick={() => onChange(ahora())}
        aria-label="Poner la hora actual"
        title="Poner la hora actual"
      >
        <ClockIcon className="hidden lg:block" />
        <span className="lg:hidden">Ahora</span>
      </Button>
    </div>
  );
}
