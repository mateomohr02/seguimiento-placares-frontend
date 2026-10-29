"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheckIcon, FileSpreadsheetIcon, TriangleAlertIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton, type ActionResult } from "@/components/confirm-action-button";
import { LoadingDots } from "@/components/loading-dots";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fechaCorta } from "@/modules/planilla/lib/estaciones";
import { MAX_BYTES_EXCEL, armarConfirmacion, cargable, contar, enviables, plural } from "../lib/importar";
import type { HojaImportada, ModoImportacion, Previsualizacion, ResultadoImportacion } from "../types/planificacion.types";
import { ImportarHoja } from "./importar-hoja";

type Paso = 1 | 2 | 3 | 4 | 5;
type Decision = ModoImportacion | "cancelar";
const TITULOS = ["Subir el archivo", "Vista previa", "Decisiones", "Confirmar"];

/** Mensaje de error de una respuesta del proxy ({ message }). */
async function mensajeDe(res: Response, porDefecto: string): Promise<string> {
  if (res.status === 401) return "La sesión venció: recargá la página e ingresá tu PIN.";
  const json = (await res.json().catch(() => null)) as { message?: string } | null;
  return json?.message ?? porDefecto;
}

function Opcion({ activa, destructiva, onClick, children }: { activa: boolean; destructiva?: boolean; onClick: () => void; children: React.ReactNode }) {
  const color = activa ? (destructiva ? "border-destructive bg-destructive/15 text-destructive" : "border-transparent bg-primary text-primary-foreground") : "hover:bg-muted";
  return (
    <button type="button" aria-pressed={activa} onClick={onClick} className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium ${color}`}>
      {children}
    </button>
  );
}

// Importador de planificación desde Excel (técnica). Cuatro pasos y nada se escribe en la base hasta el último: 1 subir el .xlsx, 2 vista
// previa con avisos y corrección de N° TW, 3 decisiones (sin pedido / semana existente) y 4 confirmar. Después, el resultado por planificación.
export function ImportarDialog() {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [paso, setPaso] = useState<Paso>(1);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [prev, setPrev] = useState<Previsualizacion | null>(null);
  const [hojas, setHojas] = useState<HojaImportada[]>([]);
  const [activa, setActiva] = useState(0);
  const [analizando, setAnalizando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sinPedido, setSinPedido] = useState<"cargar" | "excluir" | null>(null);
  const [decisiones, setDecisiones] = useState<Record<string, Decision>>({});
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);

  function reiniciar() {
    setPaso(1);
    setArchivo(null);
    setPrev(null);
    setHojas([]);
    setActiva(0);
    setError(null);
    setSinPedido(null);
    setDecisiones({});
    setResultado(null);
  }

  function abrir(next: boolean) {
    if (analizando) return;
    if (next) reiniciar();
    else if (resultado) router.refresh();
    setOpen(next);
  }

  function elegirArchivo(f: File | undefined) {
    setError(null);
    if (!f) return;
    if (!/\.xlsx$/i.test(f.name)) return setError("El archivo tiene que ser un Excel .xlsx.");
    if (f.size > MAX_BYTES_EXCEL) return setError("El archivo supera los 5 MB.");
    setArchivo(f);
  }

  async function analizar() {
    if (!archivo) return;
    setAnalizando(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("archivo", archivo);
      const res = await fetch("/planificacion-api/importar/previsualizar", { method: "POST", body: fd });
      if (!res.ok) return setError(await mensajeDe(res, "No se pudo leer el archivo."));
      const json = (await res.json().catch(() => null)) as { data?: Previsualizacion } | null;
      if (!json?.data) return setError("Respuesta inválida del servidor.");
      setPrev(json.data);
      setHojas(json.data.hojas);
      setActiva(Math.max(0, json.data.hojas.findIndex(cargable)));
      setSinPedido(null);
      setDecisiones({});
      setPaso(2);
    } catch {
      setError("No se pudo comunicar con el servidor.");
    } finally {
      setAnalizando(false);
    }
  }

  // ---- Derivados ----
  // Hojas que realmente se cargarían: con planificación, con filas para cargar y sin «Cancelar» elegido.
  const conFilas = hojas.filter((h) => cargable(h) && enviables(h).length > 0);
  const aCargar = conFilas.filter((h) => !(h.existente.filas > 0 && decisiones[h.planificacion!.clave] === "cancelar"));
  const conExistente = conFilas.filter((h) => h.existente.filas > 0);
  const sinPedidoTotal = aCargar.reduce((n, h) => n + contar(h.filas).sinPedido, 0);
  const falta = (sinPedidoTotal > 0 && sinPedido === null) || conExistente.some((h) => decisiones[h.planificacion!.clave] === undefined);
  const hayQueCargar = aCargar.length > 0;

  function resumen(h: HojaImportada) {
    const c = contar(h.filas);
    const modo: Decision = h.existente.filas > 0 ? (decisiones[h.planificacion!.clave] ?? "cancelar") : "agregar";
    const cargadas = c.ok + (sinPedido === "cargar" ? c.sinPedido : 0);
    const repetidas = modo === "agregar" ? enviables(h).filter((f) => f.ya_existe).length : 0;
    return { c, modo, cargadas, repetidas, excluidasSinPedido: sinPedido === "cargar" ? 0 : c.sinPedido };
  }
  const hayPisar = aCargar.some((h) => h.existente.filas > 0 && decisiones[h.planificacion!.clave] === "pisar");

  async function cargar(): Promise<ActionResult> {
    if (!prev) return { success: false, message: "Falta el archivo." };
    try {
      const res = await fetch("/planificacion-api/importar/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(armarConfirmacion(prev.semana_inicio, hojas, decisiones, sinPedido ?? "excluir")),
      });
      if (!res.ok) return { success: false, message: await mensajeDe(res, "No se pudo cargar la planificación.") };
      const json = (await res.json().catch(() => null)) as { data?: ResultadoImportacion } | null;
      if (!json?.data) return { success: false, message: "Respuesta inválida del servidor." };
      setResultado(json.data);
      setPaso(5);
      router.refresh();
      return { success: true };
    } catch {
      return { success: false, message: "No se pudo comunicar con el servidor." };
    }
  }

  const hojaActiva = hojas[activa];

  return (
    <Dialog open={open} onOpenChange={abrir}>
      <DialogTrigger
        render={
          <Button variant="outline" className="h-11 gap-2 px-4">
            <FileSpreadsheetIcon /> Importar planificación
          </Button>
        }
      />
      <DialogContent showCloseButton={false} className="max-h-[94dvh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Importar planificación desde Excel</DialogTitle>
          <DialogDescription>
            {paso === 5 ? "Listo." : `Paso ${paso} de 4 · ${TITULOS[paso - 1]}. Hasta confirmar en el paso 4 no se guarda nada.`}
          </DialogDescription>
        </DialogHeader>

        {paso === 1 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Elegí el Excel <strong>Planificación DD-MM-AA.xlsx</strong>: la semana sale de la fecha del nombre del archivo (cualquier día de la semana vale) y cada hoja se
              carga en la planificación que se llama igual (hoy «Termolaminado» y «Calidad»); las demás hojas se omiten. Máximo 5 MB y 2000 filas.
            </p>
            <input
              ref={entrada}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              aria-label="Archivo Excel de planificación"
              onChange={(e) => {
                elegirArchivo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => entrada.current?.click()}
              className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-4 text-sm hover:bg-muted"
            >
              <UploadIcon className="size-6" />
              {archivo ? (
                <>
                  <strong className="break-all">{archivo.name}</strong>
                  <span className="text-xs text-muted-foreground">{(archivo.size / 1024).toFixed(0)} KB · tocá para elegir otro</span>
                </>
              ) : (
                <strong>Elegir archivo .xlsx</strong>
              )}
            </button>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        )}

        {paso === 2 && prev && (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Archivo <strong className="break-all">{prev.archivo}</strong> · semana del <strong>{fechaCorta(prev.semana_inicio)}</strong> (lunes).
            </p>
            {prev.avisos.length > 0 && (
              <ul className="flex flex-col gap-1 rounded-lg border border-amber-500/60 bg-amber-500/10 p-3 text-sm">
                {prev.avisos.map((a, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-600" /> {a}
                  </li>
                ))}
              </ul>
            )}
            {hojas.length === 0 ? (
              <p className="rounded-lg border p-4 text-sm text-muted-foreground">El archivo no tiene hojas con datos.</p>
            ) : (
              <>
                <div role="tablist" aria-label="Hojas del archivo" className="flex flex-wrap gap-2">
                  {hojas.map((h, i) => (
                    <button
                      key={`${h.nombre_hoja}-${i}`}
                      type="button"
                      role="tab"
                      aria-selected={i === activa}
                      onClick={() => setActiva(i)}
                      className={`inline-flex min-h-11 flex-col items-start justify-center rounded-lg border px-4 py-1 text-left text-sm font-medium ${i === activa ? "border-transparent bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    >
                      {h.nombre_hoja}
                      <span className="text-xs font-normal opacity-80">{cargable(h) ? `${h.planificacion!.nombre} · ${plural(h.filas.length, "fila", "filas")}` : "omitida"}</span>
                    </button>
                  ))}
                </div>
                {hojaActiva && (
                  <ImportarHoja
                    key={`${hojaActiva.nombre_hoja}-${activa}`}
                    hoja={hojaActiva}
                    onHoja={(nueva) => setHojas((hs) => hs.map((h, i) => (i === activa ? nueva : h)))}
                  />
                )}
              </>
            )}
            {conFilas.length === 0 && hojas.length > 0 && (
              <p role="alert" className="text-sm text-destructive">
                Ninguna hoja tiene filas para cargar.
              </p>
            )}
          </div>
        )}

        {paso === 3 && (
          <div className="flex flex-col gap-4">
            {sinPedidoTotal === 0 && conExistente.length === 0 && <p className="rounded-lg border p-4 text-sm text-muted-foreground">No hay nada que decidir: seguí al paso 4.</p>}

            {sinPedidoTotal > 0 && (
              <section className="flex flex-col gap-2 rounded-lg border p-3">
                <h3 className="font-semibold">
                  {plural(sinPedidoTotal, "N° TW sin pedido en la app", "N° TW sin pedido en la app")}
                </h3>
                <p className="text-sm text-muted-foreground">¿Qué hacemos con las filas cuyo N° TW no está en la app? (Una sola respuesta para todo el archivo.)</p>
                <div className="flex flex-wrap gap-2">
                  <Opcion activa={sinPedido === "cargar"} onClick={() => setSinPedido("cargar")}>
                    Cargarlas igual, sin pedido asociado
                  </Opcion>
                  <Opcion activa={sinPedido === "excluir"} onClick={() => setSinPedido("excluir")}>
                    Excluir esas filas
                  </Opcion>
                </div>
              </section>
            )}

            {conExistente.map((h) => {
              const id = h.planificacion!.clave;
              const d = decisiones[id];
              const e = h.existente;
              return (
                <section key={id} className="flex flex-col gap-2 rounded-lg border p-3">
                  <h3 className="font-semibold">
                    {h.planificacion!.nombre}: la semana ya tiene planificación
                  </h3>
                  <p className="text-sm">
                    Hoy tiene <strong>{plural(e.filas, "fila", "filas")}</strong>, <strong>{plural(e.marcas, "marca de estado", "marcas de estado")}</strong> y{" "}
                    <strong>{plural(e.observaciones, "observación de usuarios", "observaciones de usuarios")}</strong>. ¿Qué hacemos?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Opcion activa={d === "pisar"} destructiva onClick={() => setDecisiones((p) => ({ ...p, [id]: "pisar" }))}>
                      Pisar
                    </Opcion>
                    <Opcion activa={d === "agregar"} onClick={() => setDecisiones((p) => ({ ...p, [id]: "agregar" }))}>
                      Agregar solo las filas nuevas
                    </Opcion>
                    <Opcion activa={d === "cancelar"} onClick={() => setDecisiones((p) => ({ ...p, [id]: "cancelar" }))}>
                      Cancelar (no cargar esta planificación)
                    </Opcion>
                  </div>
                  {d === "pisar" && (
                    <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
                      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
                      <span>
                        Se van a perder las {plural(e.filas, "fila", "filas")} actuales de esa semana, sus {plural(e.marcas, "marca de estado", "marcas de estado")} y sus{" "}
                        {plural(e.observaciones, "observación", "observaciones")}: dejan de verse y se cargan las del archivo.
                      </span>
                    </p>
                  )}
                  {d === "agregar" && (
                    <p className="text-sm text-muted-foreground">
                      Se cargan solo las filas que no estén ya (mismo N° TW{h.planificacion!.clave === "CALIDAD" ? " y mismo día" : ""}); las nuevas van al final.
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {paso === 4 && prev && (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Se va a cargar la planificación de la <strong>semana del {fechaCorta(prev.semana_inicio)}</strong> en:
            </p>
            {!hayQueCargar ? (
              <p role="alert" className="text-sm text-destructive">
                No queda ninguna planificación para cargar (cancelaste todas o no hay filas): no se escribe nada.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {aCargar.map((h) => {
                  const r = resumen(h);
                  const e = h.existente;
                  return (
                    <li key={h.planificacion!.clave} className="rounded-lg border p-3 text-sm">
                      <strong>{h.planificacion!.nombre}</strong> (hoja «{h.nombre_hoja}»): {plural(r.cargadas, "fila", "filas")} a cargar
                      {r.c.sinPedido > 0 && (sinPedido === "cargar" ? `, ${r.c.sinPedido} de ellas sin pedido asociado` : `; ${plural(r.excluidasSinPedido, "fila sin pedido excluida", "filas sin pedido excluidas")}`)}
                      {r.c.duplicadas + r.c.invalidas > 0 && `; ${plural(r.c.duplicadas + r.c.invalidas, "fila no se carga (duplicada o inválida)", "filas no se cargan (duplicadas o inválidas)")}`}.
                      {e.filas > 0 && r.modo === "pisar" && (
                        <span className="mt-1 block font-medium text-destructive">
                          Pisar: se pierden {plural(e.filas, "fila", "filas")}, {plural(e.marcas, "marca", "marcas")} y {plural(e.observaciones, "observación", "observaciones")} actuales.
                        </span>
                      )}
                      {e.filas > 0 && r.modo === "agregar" && (
                        <span className="mt-1 block text-muted-foreground">
                          Agregar solo las nuevas: las {plural(e.filas, "fila actual", "filas actuales")} no se tocan{r.repetidas > 0 ? ` y se omiten ${r.repetidas} que ya están` : ""}.
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {conFilas.length > aCargar.length && (
              <p className="text-sm text-muted-foreground">
                No se cargan: {conFilas.filter((h) => !aCargar.includes(h)).map((h) => h.planificacion!.nombre).join(", ")} (cancelaste).
              </p>
            )}
            <p className="text-xs text-muted-foreground">El servidor vuelve a revisar todo al cargar y lo guarda de una sola vez: si algo falla, no queda nada a medias.</p>
          </div>
        )}

        {paso === 5 && resultado && (
          <div className="flex flex-col gap-3">
            <p className="flex items-center gap-2 font-medium">
              <CircleCheckIcon className="size-5 text-emerald-600" /> Planificación cargada: semana del {fechaCorta(resultado.semana_inicio)}.
            </p>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Planificación</TableHead>
                    <TableHead>Cargadas</TableHead>
                    <TableHead>Sin pedido</TableHead>
                    <TableHead>Excluidas</TableHead>
                    <TableHead>Ya estaban</TableHead>
                    <TableHead>Quitadas</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.planificaciones.map((e) => (
                    <TableRow key={e.clave}>
                      <TableCell className="font-medium">{e.nombre}</TableCell>
                      <TableCell>{e.cargadas}</TableCell>
                      <TableCell>{e.sin_pedido}</TableCell>
                      <TableCell>{e.excluidas}</TableCell>
                      <TableCell>{e.ya_existentes_omitidas}</TableCell>
                      <TableCell>{e.quitadas}</TableCell>
                      <TableCell>
                        <Link
                          href={`/planificacion?plantilla=${encodeURIComponent(e.clave)}&semana=${resultado.semana_inicio}`}
                          onClick={() => abrir(false)}
                          className="inline-flex h-11 items-center rounded-lg border px-4 text-sm font-medium whitespace-nowrap hover:bg-muted"
                        >
                          Ver planificación
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {resultado.planificaciones.some((e) => e.avisos?.length > 0) && (
              <ul className="flex flex-col gap-1 text-sm">
                {resultado.planificaciones.flatMap((e) => (e.avisos ?? []).map((a, i) => <li key={`${e.clave}-${i}`}>{e.nombre}: {a}</li>))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              «Sin pedido»: filas cargadas sin pedido asociado. «Excluidas»: filas que no se cargaron. «Ya estaban»: omitidas por estar ya cargadas. «Quitadas»: filas anteriores que se pisaron.
            </p>
          </div>
        )}

        <DialogFooter>
          {paso === 5 ? (
            <Button className="h-11 px-5" onClick={() => abrir(false)}>
              Cerrar
            </Button>
          ) : (
            <>
              <Button variant="outline" className="h-11 px-5" disabled={analizando} onClick={() => abrir(false)}>
                Cancelar
              </Button>
              {paso > 1 && (
                <Button variant="outline" className="h-11 px-5" onClick={() => setPaso((paso - 1) as Paso)}>
                  Volver
                </Button>
              )}
              {paso === 1 && (
                <Button className="h-11 px-5" disabled={!archivo || analizando} onClick={analizar}>
                  {analizando ? <LoadingDots /> : "Ver vista previa"}
                </Button>
              )}
              {paso === 2 && (
                <Button className="h-11 px-5" disabled={conFilas.length === 0} onClick={() => setPaso(3)}>
                  Siguiente
                </Button>
              )}
              {paso === 3 && (
                <Button className="h-11 px-5" disabled={falta} onClick={() => setPaso(4)}>
                  Siguiente
                </Button>
              )}
              {paso === 4 && (
                <ConfirmActionButton
                  variant={hayPisar ? "destructive" : "default"}
                  className="h-11 px-5"
                  label="Cargar planificación"
                  disabled={!hayQueCargar}
                  title="¿Cargar la planificación?"
                  description={
                    <>
                      Se cargan {plural(aCargar.reduce((n, h) => n + resumen(h).cargadas, 0), "fila", "filas")} en {plural(aCargar.length, "planificación", "planificaciones")}
                      {hayPisar ? ", y se pierden las filas, marcas y observaciones actuales de las planificaciones que elegiste pisar" : ""}. Esta acción no se puede deshacer desde acá.
                    </>
                  }
                  confirmLabel="Cargar"
                  successMessage="Planificación importada."
                  errorTitle="No se pudo importar la planificación"
                  run={cargar}
                />
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
