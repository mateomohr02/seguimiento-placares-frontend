import Link from "next/link";
import { FileTextIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { HojaCorteEliminar } from "./hoja-corte-eliminar";
import type { HojaCorte } from "../types/hoja-corte.types";

const fecha = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" });
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function HojasCorteLista({ ordenId, hojas }: { ordenId: string; hojas: HojaCorte[] }) {
  if (hojas.length === 0) {
    return <p className="text-sm text-muted-foreground">Esta orden todavía no tiene hojas de corte cargadas.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {hojas.map((h) => (
        <li key={h.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
          <FileTextIcon className="size-6 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{h.nombre}</div>
            <div className="truncate text-sm text-muted-foreground">
              {h.nombre_archivo} · {mb(h.tamano)} · cargada {fecha.format(new Date(h.creado_en))}
            </div>
          </div>
          <Link
            href={`/ordenes/${ordenId}/hojas-corte/${h.id}`}
            className={buttonVariants({ className: "h-11 px-5" })}
          >
            Abrir
          </Link>
          <HojaCorteEliminar hoja={h} />
        </li>
      ))}
    </ul>
  );
}
