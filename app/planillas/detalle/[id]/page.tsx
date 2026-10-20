import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede, puedeCompletarPlanilla } from "@/lib/auth/permisos";
import { Badge } from "@/components/ui/badge";
import { VolverLink } from "@/components/volver-link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ETIQUETA_ESTACION, fechaCorta, slugEstacion } from "@/modules/planilla/lib/estaciones";
import { FotosSoloLectura } from "@/modules/planilla/components/fotos-fila";
import type { DatosVersion, FilaPlanilla, Planilla } from "@/modules/planilla/types/planilla.types";

const fechaHora = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" });
const v = (x: string | number | null) => (x === null || x === "" ? "—" : x);

type FilaTabla = Omit<FilaPlanilla, "fotos">;

function TablaFilas({ filas, pvc }: { filas: FilaTabla[]; pvc: boolean }) {
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
            {pvc && (
              <>
                <TableHead>Colores</TableHead>
                <TableHead className="text-right">Mesa chica</TableHead>
                <TableHead className="text-right">Mesa grande</TableHead>
                <TableHead>Colocación PVC</TableHead>
                <TableHead>Perfilado</TableHead>
              </>
            )}
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
              {pvc && (
                <>
                  <TableCell>{v(f.colores)}</TableCell>
                  <TableCell className="text-right">{v(f.mesa_chica)}</TableCell>
                  <TableCell className="text-right">{v(f.mesa_grande)}</TableCell>
                  <TableCell>{v(f.colocacion_pvc)}</TableCell>
                  <TableCell>{v(f.perfilado)}</TableCell>
                </>
              )}
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
  const conFotos = planilla.filas.filter((f) => f.fotos.length > 0);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6">
      <VolverLink href="/planillas/registros">Registros</VolverLink>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {ETIQUETA_ESTACION[planilla.estacion]} — {fechaCorta(planilla.fecha)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Operarios: {planilla.operarios.join(", ") || "sin configurar"} · creada por {planilla.creado_por} el{" "}
            {fechaHora.format(new Date(planilla.creado_en))} · última modificación de {planilla.modificado_por} el{" "}
            {fechaHora.format(new Date(planilla.actualizado_en))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={planilla.estado === "GUARDADA" ? "default" : "secondary"}>{planilla.estado === "GUARDADA" ? "Guardada" : "Borrador"}</Badge>
          {puedeCompletarPlanilla(sesion, planilla.estacion) && (
            <Link
              href={`/planillas/${slugEstacion(planilla.estacion)}?fecha=${planilla.fecha}`}
              className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted"
            >
              Abrir para editar
            </Link>
          )}
        </div>
      </div>

      <TablaFilas filas={planilla.filas} pvc={pvc} />

      {pvc && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Fotos de las piezas</h2>
          {conFotos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Esta planilla no tiene fotos.</p>
          ) : (
            conFotos.map((f) => (
              <div key={f.id} className="flex flex-col gap-2 rounded-lg border p-3">
                <div className="text-sm font-medium">
                  Ítem {planilla.filas.indexOf(f) + 1} — {f.pedido_codigo || "sin pedido"} ({f.fotos.length} foto{f.fotos.length === 1 ? "" : "s"})
                </div>
                <FotosSoloLectura fotos={f.fotos} />
              </div>
            ))
          )}
        </section>
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
              <div className="mt-3">
                <TablaFilas filas={ver.datos.filas} pvc={pvc} />
              </div>
            </details>
          ))
        )}
      </section>
    </main>
  );
}
