import { UserIcon } from "lucide-react";
import { SalirForm } from "@/modules/auth/components/salir-form";
import { getSesion } from "@/lib/auth/sesion";

// Quién está usando la app, y salir. Va a la derecha de la barra de navegación.
export async function UsuarioMenu() {
  const sesion = await getSesion();
  if (!sesion) return null;

  return (
    <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
      <UserIcon className="size-4" />
      <span className="max-w-28 truncate sm:max-w-none">
        <span className="font-medium text-foreground">{sesion.nombre}</span>
        <span className="hidden xl:inline"> · {sesion.rol}</span>
      </span>
      <SalirForm />
    </div>
  );
}
