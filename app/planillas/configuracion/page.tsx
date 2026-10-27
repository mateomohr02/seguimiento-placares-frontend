import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { EstadosForm } from "@/modules/planilla/components/estados-form";
import { EstacionesConfig } from "@/modules/estacion-trabajo/components/estaciones-config";
import type { EstadoProduccion } from "@/modules/planilla/types/planilla.types";
import type { EstacionTrabajo, UsuarioDeEstacion } from "@/modules/estacion-trabajo/types/estacion-trabajo.types";
import type { Usuario } from "@/modules/usuario/types/usuario.types";

export default async function ConfiguracionPlanillasPage() {
  const sesion = await requireSesion();
  if (!puede(sesion, PERMISOS.PLANILLAS_CONFIGURAR)) notFound();
  // Asignar operarios a una estación requiere poder listar a las personas (usuarios.gestionar).
  const gestionaUsuarios = puede(sesion, PERMISOS.USUARIOS_GESTIONAR);
  const [estados, estaciones, usuarios] = await Promise.all([
    apiFetch<EstadoProduccion[]>("/planillas/estados"),
    apiFetch<EstacionTrabajo[]>("/estaciones-trabajo"),
    gestionaUsuarios ? apiFetch<Usuario[]>("/usuarios") : Promise.resolve(null),
  ]);
  const personas: UsuarioDeEstacion[] | null =
    usuarios?.map((u) => ({ id: u.id, nombre: u.nombre, apellido: u.apellido, rol: u.rol, activo: u.activo })) ?? null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6">
      <h1 className="text-xl font-semibold">Configuración de Termolaminado</h1>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Estados de producción</h2>
          <p className="text-sm text-muted-foreground">
            Los estados que se marcan en la planificación cuando un pedido termina en una estación (ej. «Listo Termolaminado»). Después se le asigna uno a cada estación de trabajo; varias estaciones pueden compartir el mismo.
          </p>
        </div>
        <EstadosForm key={estados.map((e) => e.id).join()} inicial={estados} />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Estaciones de trabajo</h2>
          <p className="text-sm text-muted-foreground">
            Cada estación (termolaminado1, mecanizado1…) tiene las planillas que completan sus operarios, el estado de producción que marcan en la planificación y sus operarios. Un operario puede estar en varias estaciones. Las personas, su PIN y su rol se administran en{" "}
            {gestionaUsuarios ? (
              <Link href="/usuarios" className="underline underline-offset-3">
                Usuarios
              </Link>
            ) : (
              "Usuarios"
            )}
            . Los operarios ven los cambios al recargar la página.
          </p>
        </div>
        <EstacionesConfig estaciones={estaciones} estados={estados} usuarios={personas} />
      </section>
    </main>
  );
}
