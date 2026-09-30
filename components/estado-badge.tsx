import { CheckIcon } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";

export const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  EN_PRODUCCION: "En producción",
  LISTA: "Lista",
  FINALIZADO: "Finalizado",
  CORTADA: "Cortada",
  ELIMINADO: "Eliminado",
  ELIMINADA: "Eliminada",
};

// El rojo de marca (--primary) queda reservado para acciones/activo — los
// estados "terminado" usan variant="secondary" (gris neutro) + check, para
// no leerse como alerta.
const VARIANT: Record<string, "outline" | "secondary" | "default"> = {
  PENDIENTE: "outline",
  EN_PROCESO: "outline",
  EN_PRODUCCION: "outline",
  LISTA: "secondary",
  FINALIZADO: "secondary",
  CORTADA: "secondary",
  ELIMINADO: "outline",
  ELIMINADA: "outline",
};

const DONE = new Set(["LISTA", "FINALIZADO", "CORTADA"]);

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <Badge
      variant={VARIANT[estado] ?? "outline"}
      className={cn(
        estado === "PENDIENTE" && "bg-white",
        (estado === "EN_PROCESO" || estado === "EN_PRODUCCION") &&
          "border-gold/40 bg-gold/15 text-[#6b5231]",
        DONE.has(estado) && "border-green-300 bg-green-100 text-green-800",
      )}
    >
      {DONE.has(estado) && <CheckIcon />}
      {ESTADO_LABEL[estado] ?? estado}
    </Badge>
  );
}
