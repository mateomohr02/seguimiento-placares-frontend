import Link from "next/link";
import { cn } from "cn";
import { LINEA_LABEL, LINEAS, type Linea } from "@/lib/linea";

/** Filtro por línea del listado de órdenes (Todas / Placares / Cocinas).
 *  Son links: el valor viaja en `?linea=` y se resuelve en el servidor. */
export function FiltroLinea({ linea, archivadas }: { linea?: Linea; archivadas: boolean }) {
  const href = (l?: Linea) => {
    const q = new URLSearchParams();
    if (archivadas) q.set("archivadas", "1");
    if (l) q.set("linea", l.toLowerCase());
    const s = q.toString();
    return s ? `/?${s}` : "/";
  };
  const opciones: { valor?: Linea; label: string }[] = [
    { label: "Todas" },
    ...LINEAS.map((l) => ({ valor: l, label: LINEA_LABEL[l] })),
  ];

  return (
    <nav aria-label="Filtrar por línea" className="inline-flex rounded-lg border bg-background p-0.5">
      {opciones.map((o) => {
        const activa = o.valor === linea;
        return (
          <Link
            key={o.label}
            href={href(o.valor)}
            aria-current={activa ? "true" : undefined}
            className={cn(
              "inline-flex min-h-11 min-w-20 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors",
              activa ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {o.label}
          </Link>
        );
      })}
    </nav>
  );
}
