import { LogOutIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/modules/auth/actions/login.action";
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
      <form action={logoutAction}>
        <Button type="submit" variant="ghost" size="sm" className="gap-1">
          <LogOutIcon /> Salir
        </Button>
      </form>
    </div>
  );
}
