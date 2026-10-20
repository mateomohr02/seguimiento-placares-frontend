import Link from "next/link";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { parseLinea } from "@/lib/linea";
import { Button } from "@/components/ui/button";
import { AgregarOrdenDialog } from "@/modules/orden/components/agregar-orden-dialog";
import { FiltroLinea } from "@/modules/orden/components/filtro-linea";
import { OrdenesTable } from "@/modules/orden/components/ordenes-table";
import type { Orden } from "@/modules/orden/types/orden.types";

export default async function OrdenesPage({
  searchParams,
}: {
  searchParams: Promise<{ archivadas?: string; linea?: string }>;
}) {
  const sesion = await requireSesion();
  const puedeGestionar = puede(sesion, PERMISOS.ORDENES_GESTIONAR);
  const puedeEscanear = puede(sesion, PERMISOS.PIEZAS_MARCAR);
  const params = await searchParams;
  const archivadas = params.archivadas === "1";
  const linea = parseLinea(params.linea?.toUpperCase());
  const ordenes = await apiFetch<Orden[]>(
    `/ordenes?archivadas=${archivadas}${linea ? `&linea=${linea}` : ""}`,
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            {archivadas ? "Órdenes archivadas" : "Órdenes de fabricación"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Seguimiento de piezas de placares y cocinas sincronizadas desde TeoWin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            nativeButton={false}
            render={
              <Link href={`/${archivadas ? "" : "?archivadas=1"}${linea ? `${archivadas ? "?" : "&"}linea=${linea.toLowerCase()}` : ""}`}>
                {archivadas ? "Ver activas" : "Ver archivadas"}
              </Link>
            }
          />
          {puedeEscanear && (
            <Button variant="outline" nativeButton={false} render={<Link href="/escaneo">Escanear</Link>} />
          )}
          {puedeGestionar && <AgregarOrdenDialog />}
        </div>
      </div>

      <FiltroLinea linea={linea} archivadas={archivadas} />

      <OrdenesTable ordenes={ordenes} archivadas={archivadas} linea={linea} puedeGestionar={puedeGestionar} />
    </main>
  );
}
