import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede, puedeAbrirPlanillaDe } from "@/lib/auth/permisos";
import { Badge } from "@/components/ui/badge";
import { VolverLink } from "@/components/volver-link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ETIQUETA_ESTACION, etiquetaMesa, fechaCorta, rutaPlanilla } from "@/modules/planilla/lib/estaciones";
import { FotosSoloLectura } from "@/modules/planilla/components/fotos-fila";
import type { DatosVersion, FilaPlanilla, FilaVersion, FotoFila, Planilla } from "@/modules/planilla/types/planilla.types";

const fechaHora = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" });
const v = (x: string | number | null) => (x === null || x === "" ? "—" : x);

type FilaTabla = Pick<FilaPlanilla, "id" | "hora_inicio" | "hora_fin" | "pedido_codigo" | "cantidad_piezas" | "observaciones">;

/** Una tanda de mesas de PVC lista para mostrar (de la planilla actual o de una versión previa, que puede tener el formato viejo). */
interface Tanda {
  id: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  mesas: string;
  colores: string | null;
  colocacion_pvc: string | null;
  perfilado: string | null;
  observaciones: string | null;
  pedidos: { pedido_codigo: string; cantidad_piezas: number | null }[];
  fotos: FotoFila[];
  nFotos: number;
}

function aTanda(f: FilaPlanilla | FilaVersion): Tanda {
  // Las versiones guardadas antes de «PVC por mesa» traen un pedido por fila y mesa_chica / mesa_grande sueltas.
  const l = f as { mesa_chica?: number | null; mesa_grande?: number | null };
  const viejo = !f.pedidos && (l.mesa_chica != null || l.mesa_grande != null || f.pedido_codigo !== "");
  const mesas = viejo
    ? [l.mesa_chica ? `Chica ×${l.mesa_chica}` : "", l.mesa_grande ? `Grande ×${l.mesa_grande}` : ""].filter(Boolean).join(" + ") || "—"
    : etiquetaMesa(f.mesa_tamano, f.mesa_cantidad);
  const pedidos = f.pedidos ?? (f.pedido_codigo ? [{ pedido_codigo: f.pedido_codigo, cantidad_piezas: f.cantidad_piezas }] : []);
  const fotos = Array.isArray(f.fotos) ? f.fotos : ((f as FilaVersion).fotos_lista ?? []);
  return {
    id: f.id,
    hora_inicio: f.hora_inicio,
    hora_fin: f.hora_fin,
    mesas,
    colores: f.colores,
    colocacion_pvc: f.colocacion_pvc,
    perfilado: f.perfilado,
    observaciones: f.observaciones,
    pedidos,
    fotos,
    nFotos: Array.isArray(f.fotos) ? f.fotos.length : f.fotos,
  };
}

const piezasDe = (t: Tanda) => t.pedidos.reduce((s, p) => s + (p.cantidad_piezas ?? 0), 0);

function TotalesPvc({ filas }: { filas: (FilaPlanilla | FilaVersion)[] }) {
  const chicas = filas.reduce((s, f) => s + (f.mesa_tamano === "CHICA" ? (f.mesa_cantidad ?? 0) : 0), 0);
  const grandes = filas.reduce((s, f) => s + (f.mesa_tamano === "GRANDE" ? (f.mesa_cantidad ?? 0) : 0), 0);
  const piezas = filas.reduce((s, f) => s + piezasDe(aTanda(f)), 0);
  return (
    <dl className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-3 text-center" aria-label="Totales del día">
      <div>
        <dt className="text-xs text-muted-foreground">Mesas chicas</dt>
        <dd className="text-2xl font-semibold tabular-nums">{chicas}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Mesas grandes</dt>
        <dd className="text-2xl font-semibold tabular-nums">{grandes}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Piezas</dt>
        <dd className="text-2xl font-semibold tabular-nums">{piezas}</dd>
      </div>
    </dl>
  );
}

function TandasPvc({ filas, quitadas }: { filas: (FilaPlanilla | FilaVersion)[]; quitadas?: Set<string> }) {
  if (filas.length === 0) return <p className="text-sm text-muted-foreground">Sin tandas.</p>;
  return (
    <ol className="flex flex-col gap-3">
      {filas.map((f, i) => {
        const t = aTanda(f);
        return (
          <li key={t.id} className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h3 className="font-semibold">Tanda {i + 1}</h3>
              <span className="text-sm">Mesa {t.mesas}</span>
              <span className="text-sm">Color {v(t.colores)}</span>
              <span className="text-sm">
                {v(t.hora_inicio)} a {v(t.hora_fin)}
              </span>
              <span className="text-sm text-muted-foreground">
                {piezasDe(t)} pieza{piezasDe(t) === 1 ? "" : "s"}
                {quitadas?.has(t.id) ? " · quitada en la corrección" : ""}
              </span>
            </div>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° pedido</TableHead>
                    <TableHead className="text-right">Piezas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {t.pedidos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-muted-foreground">
                        Sin pedidos.
                      </TableCell>
                    </TableRow>
                  )}
                  {t.pedidos.map((p, j) => (
                    <TableRow key={j}>
                      <TableCell className="font-medium">{v(p.pedido_codigo)}</TableCell>
                      <TableCell className="text-right">{v(p.cantidad_piezas)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Colocación PVC</dt>
                <dd>{v(t.colocacion_pvc)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Corte y perfilado</dt>
                <dd>{v(t.perfilado)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Observaciones</dt>
                <dd>{v(t.observaciones)}</dd>
              </div>
            </dl>
            {t.fotos.length > 0 ? (
              <FotosSoloLectura fotos={t.fotos} />
            ) : (
              <span className="text-sm text-muted-foreground">{t.nFotos > 0 ? `${t.nFotos} foto(s) (ya no están disponibles)` : "Sin fotos"}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function TablaFilas({ filas }: { filas: FilaTabla[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ítem</TableHead>
            <TableHead>N° pedido</TableHead>
            <TableHead>Inicio</TableHead>
            <TableHead>Fin</TableHead>
            <TableHead className="text-right">Piezas</TableHead>
            <TableHead>Observaciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((f, i) => (
            <TableRow key={f.id}>
              <TableCell>{i + 1}</TableCell>
              <TableCell className="font-medium">{v(f.pedido_codigo)}</TableCell>
              <TableCell>{v(f.hora_inicio)}</TableCell>
              <TableCell>{v(f.hora_fin)}</TableCell>
              <TableCell className="text-right">{v(f.cantidad_piezas)}</TableCell>
              <TableCell>{v(f.observaciones)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function DetallePlanillaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sesion = await requireSesion();
  if (!puede(sesion, PERMISOS.PLANILLAS_VER)) notFound();

  let planilla: Planilla;
  try {
    planilla = await apiFetch<Planilla>(`/planillas/${id}`);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400 || e.status === 403)) notFound();
    throw e;
  }
  const versiones = await Promise.all(planilla.versiones.map((x) => apiFetch<DatosVersion>(`/planillas/versiones/${x.id}`)));
  const pvc = planilla.estacion === "PVC";
  const idsActuales = new Set(planilla.filas.map((f) => f.id));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6">
      <VolverLink href="/planillas/registros">Registros</VolverLink>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {ETIQUETA_ESTACION[planilla.estacion]} — {planilla.estacion_trabajo.nombre} — {fechaCorta(planilla.fecha)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Operarios: {planilla.operarios.map((o) => o.nombre).join(", ") || "sin operarios"} · creada por {planilla.creado_por} el{" "}
            {fechaHora.format(new Date(planilla.creado_en))} · última modificación de {planilla.modificado_por} el{" "}
            {fechaHora.format(new Date(planilla.actualizado_en))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={planilla.estado === "GUARDADA" ? "default" : "secondary"}>{planilla.estado === "GUARDADA" ? "Guardada" : "Borrador"}</Badge>
          {puedeAbrirPlanillaDe(sesion, planilla.estacion, planilla.estacion_trabajo.id) && (
            <Link
              href={rutaPlanilla(planilla.estacion, planilla.estacion_trabajo.id, planilla.fecha)}
              className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted"
            >
              Abrir para editar
            </Link>
          )}
        </div>
      </div>

      {pvc ? (
        <section className="flex flex-col gap-3">
          <TotalesPvc filas={planilla.filas} />
          <TandasPvc filas={planilla.filas} />
        </section>
      ) : (
        <TablaFilas filas={planilla.filas} />
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Historial de correcciones</h2>
        {versiones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Esta planilla no se corrigió después de guardarla.</p>
        ) : (
          versiones.map((ver) => (
            <details key={ver.id} className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Versión {ver.version} — guardada por {ver.guardada_por} el {fechaHora.format(new Date(ver.guardada_en))}; reemplazada por{" "}
                {ver.reemplazada_por} el {fechaHora.format(new Date(ver.reemplazada_en))}
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                {pvc ? (
                  <>
                    <TotalesPvc filas={ver.datos.filas} />
                    <TandasPvc filas={ver.datos.filas} quitadas={new Set(ver.datos.filas.filter((f) => !idsActuales.has(f.id)).map((f) => f.id))} />
                  </>
                ) : (
                  <TablaFilas filas={ver.datos.filas} />
                )}
              </div>
            </details>
          ))
        )}
      </section>
    </main>
  );
}
