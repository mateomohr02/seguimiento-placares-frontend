import { UserIcon } from "lucide-react";
import { SalirForm } from "@/modules/auth/components/salir-form";
import { getSesion } from "@/lib/auth/sesion";
import { nombreCompleto } from "@/lib/auth/permisos";

// Quién está usando la app (nombre y apellido; en pantallas anchas, también el rol y sus
// estaciones de trabajo), y salir. Va a la derecha de la barra de navegación.
export async function UsuarioMenu() {
  const sesion = await getSesion();
  if (!sesion) return null;
  const estaciones = (sesion.estaciones ?? []).map((e) => e.nombre).join(", ");

  return (
    <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
      <UserIcon className="size-4" />
      <span className="max-w-28 truncate sm:max-w-none" title={estaciones ? `Estaciones: ${estaciones}` : undefined}>
        <span className="font-medium text-foreground">{nombreCompleto(sesion)}</span>
        <span className="hidden xl:inline">
          {" "}
          · {sesion.rol}
          {estaciones && ` · ${estaciones}`}
        </span>
      </span>
      <SalirForm />
    </div>
  );
}
