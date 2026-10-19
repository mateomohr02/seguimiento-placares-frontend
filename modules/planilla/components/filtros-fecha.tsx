import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Formulario GET de filtros (rango de fechas y los extras de cada vista). Sin JavaScript:
// recarga la página con los filtros en la URL.
export function FiltrosFecha({
  action,
  desde,
  hasta,
  children,
}: {
  action: string;
  desde: string;
  hasta: string;
  children?: React.ReactNode;
}) {
  return (
    <form action={action} method="get" className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Desde</span>
        <Input type="date" name="desde" defaultValue={desde} className="h-11 w-40" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Hasta</span>
        <Input type="date" name="hasta" defaultValue={hasta} className="h-11 w-40" />
      </label>
      {children}
      <Button type="submit" className="h-11 px-5">
        Filtrar
      </Button>
    </form>
  );
}

export const selectClass =
  "h-11 rounded-lg border border-input bg-background px-2.5 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const DIA_MS = 86_400_000;

/** Rango por defecto: los últimos 30 días hasta hoy (reloj local del servidor). */
export function rangoPorDefecto(hoy: string, desde?: string, hasta?: string) {
  const h = hasta && /^\d{4}-\d{2}-\d{2}$/.test(hasta) ? hasta : hoy;
  const d =
    desde && /^\d{4}-\d{2}-\d{2}$/.test(desde)
      ? desde
      : new Date(new Date(`${h}T00:00:00Z`).getTime() - 29 * DIA_MS).toISOString().slice(0, 10);
  return { desde: d, hasta: h };
}
