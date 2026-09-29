import Link from "next/link";
import { apiFetch } from "@/lib/api/api-client";
import { Button } from "@/components/ui/button";
import { AgregarOrdenDialog } from "@/modules/orden/components/agregar-orden-dialog";
import { OrdenesTable } from "@/modules/orden/components/ordenes-table";
import type { Orden } from "@/modules/orden/types/orden.types";

export default async function OrdenesPage() {
  const ordenes = await apiFetch<Orden[]>("/ordenes");

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Órdenes de fabricación</h1>
          <p className="text-sm text-muted-foreground">
            Seguimiento de piezas de placares sincronizadas desde TeoWin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/escaneo">Escanear</Link>} />
          <AgregarOrdenDialog />
        </div>
      </div>

      <OrdenesTable ordenes={ordenes} />
    </main>
  );
}
