import { CheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const LABEL: Record<string, string> = {
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
  EN_PROCESO: "default",
  EN_PRODUCCION: "default",
  LISTA: "secondary",
  FINALIZADO: "secondary",
  CORTADA: "secondary",
  ELIMINADO: "outline",
  ELIMINADA: "outline",
};

const DONE = new Set(["LISTA", "FINALIZADO", "CORTADA"]);

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <Badge variant={VARIANT[estado] ?? "outline"}>
      {DONE.has(estado) && <CheckIcon />}
      {LABEL[estado] ?? estado}
    </Badge>
  );
}
