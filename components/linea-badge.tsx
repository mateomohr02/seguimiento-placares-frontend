import { CookingPotIcon, DoorOpenIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LINEA_LABEL, type Linea } from "@/lib/linea";

const ICONO = { PLACARES: DoorOpenIcon, COCINAS: CookingPotIcon } as const;

/** Etiqueta de línea (texto + ícono, no depende del color). Una lista con
 *  ambas líneas muestra un badge por cada una. */
export function LineaBadge({ linea }: { linea: Linea }) {
  const Icono = ICONO[linea];
  return (
    <Badge variant="outline" className="border-muted-foreground/30 text-foreground/80">
      <Icono aria-hidden />
      {LINEA_LABEL[linea]}
    </Badge>
  );
}

export function LineasBadges({ lineas }: { lineas?: Linea[] }) {
  if (!lineas || lineas.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1" role="group" aria-label="Línea">
      {lineas.map((l) => (
        <LineaBadge key={l} linea={l} />
      ))}
    </span>
  );
}
