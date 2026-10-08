import { UserIcon } from "lucide-react";
import { SalirForm } from "@/modules/auth/components/salir-form";
import { getSesion } from "@/lib/auth/sesion";

// Quién está usando la app, y salir. Se muestra en el listado de órdenes (Vista 1).
export async function UsuarioMenu() {
  const sesion = await getSesion();
  if (!sesion) return null;

  return (
    <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
      <UserIcon className="size-4" />
      <span>
        <span className="font-medium text-foreground">{sesion.nombre}</span> · {sesion.rol}
      </span>
      <SalirForm />
    </div>
  );
}
