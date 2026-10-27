import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { UsuariosLista } from "@/modules/usuario/components/usuarios-lista";
import type { Usuario } from "@/modules/usuario/types/usuario.types";
import type { EstacionTrabajo } from "@/modules/estacion-trabajo/types/estacion-trabajo.types";

// Personas que usan la app (técnica / admin, permiso usuarios.gestionar). Técnica no ve a los admin.
export default async function UsuariosPage() {
  const sesion = await requireSesion();
  if (!puede(sesion, PERMISOS.USUARIOS_GESTIONAR)) notFound();
  // Las estaciones piden planillas.configurar: sin ese permiso solo se ofrecen las que ya tiene algún usuario.
  const [usuarios, estaciones] = await Promise.all([
    apiFetch<Usuario[]>("/usuarios"),
    puede(sesion, PERMISOS.PLANILLAS_CONFIGURAR) ? apiFetch<EstacionTrabajo[]>("/estaciones-trabajo") : Promise.resolve(null),
  ]);
  const opciones =
    estaciones?.map((e) => ({ id: e.id, nombre: e.nombre, activa: e.activa })) ??
    [...new Map(usuarios.flatMap((u) => u.estaciones).map((e) => [e.id, { ...e, activa: true }])).values()];
  opciones.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Cada persona entra a la app con su PIN. Su rol define qué puede hacer y sus estaciones de trabajo, qué planillas completa. Un usuario no se borra: se da de baja y se puede reactivar.
        </p>
      </div>
      <UsuariosLista usuarios={usuarios} estaciones={opciones} esAdmin={sesion.rol === "admin"} sesionId={sesion.id} />
    </main>
  );
}
