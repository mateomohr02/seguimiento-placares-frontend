import Link from "next/link";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { UsuarioMenu } from "@/components/usuario-menu";
import { Button } from "@/components/ui/button";
import { AgregarOrdenDialog } from "@/modules/orden/components/agregar-orden-dialog";
import { OrdenesTable } from "@/modules/orden/components/ordenes-table";
import type { Orden } from "@/modules/orden/types/orden.types";

export default async function OrdenesPage({
  searchParams,
}: {
  searchParams: Promise<{ archivadas?: string }>;
}) {
  const sesion = await requireSesion();
  const puedeGestionar = puede(sesion, PERMISOS.ORDENES_GESTIONAR);
  const puedeEscanear = puede(sesion, PERMISOS.PIEZAS_MARCAR);
  const archivadas = (await searchParams).archivadas === "1";
  const ordenes = await apiFetch<Orden[]>(`/ordenes?archivadas=${archivadas}`);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <UsuarioMenu />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            {archivadas ? "Órdenes archivadas" : "Órdenes de fabricación"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Seguimiento de piezas de placares sincronizadas desde TeoWin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            nativeButton={false}
            render={
              <Link href={archivadas ? "/" : "/?archivadas=1"}>
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

      <OrdenesTable ordenes={ordenes} archivadas={archivadas} puedeGestionar={puedeGestionar} />
    </main>
  );
}
