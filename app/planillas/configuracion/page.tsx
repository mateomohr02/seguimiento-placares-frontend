import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { EstadosForm } from "@/modules/planilla/components/estados-form";
import { UsuariosConfig } from "@/modules/planilla/components/usuarios-config";
import type { AccesoUsuario, EstadoProduccion } from "@/modules/planilla/types/planilla.types";

export default async function ConfiguracionPlanillasPage() {
  const sesion = await requireSesion();
  if (!puede(sesion, PERMISOS.PLANILLAS_CONFIGURAR)) notFound();
  const [estados, usuarios] = await Promise.all([
    apiFetch<EstadoProduccion[]>("/planillas/estados"),
    apiFetch<AccesoUsuario[]>("/planillas/accesos"),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6">
      <h1 className="text-xl font-semibold">Configuración de Termolaminado</h1>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Estados de producción</h2>
          <p className="text-sm text-muted-foreground">
            Los estados que se marcan en la planificación cuando un pedido termina en una estación (ej. «Listo Termolaminado»). Después se le asigna uno a cada usuario; varios usuarios pueden compartir el mismo.
          </p>
        </div>
        <EstadosForm key={estados.map((e) => e.id).join()} inicial={estados} />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Usuarios de fábrica</h2>
          <p className="text-sm text-muted-foreground">
            Para cada usuario: su estado de producción, las planillas que completa y los operarios que trabajan en su estación (entre ellos elige al completar una planilla). Cada cambio se guarda al instante; el usuario lo ve al recargar la página. Las planillas ya creadas conservan los nombres de operarios que tenían.
          </p>
        </div>
        <UsuariosConfig inicial={usuarios} estados={estados} />
      </section>
    </main>
  );
}
