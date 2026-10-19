import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { AccesosForm } from "@/modules/planilla/components/accesos-form";
import { OperariosForm } from "@/modules/planilla/components/operarios-form";
import type { AccesoUsuario, OperariosArea } from "@/modules/planilla/types/planilla.types";

export default async function ConfiguracionPlanillasPage() {
  const sesion = await requireSesion();
  if (!puede(sesion, PERMISOS.PLANILLAS_CONFIGURAR)) notFound();
  const [{ operarios }, accesos] = await Promise.all([
    apiFetch<OperariosArea>("/planillas/operarios"),
    apiFetch<AccesoUsuario[]>("/planillas/accesos"),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6">
      <h1 className="text-xl font-semibold">Configuración de Termolaminado</h1>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Operarios</h2>
          <p className="text-sm text-muted-foreground">
            Estos nombres salen en el encabezado de las planillas de Lijado, Encolado y PVC. Las planillas que ya se crearon conservan los nombres que tenían.
          </p>
        </div>
        <OperariosForm inicial={operarios} />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Acceso a las planillas</h2>
          <p className="text-sm text-muted-foreground">
            Elegí qué planillas completa cada usuario. Cada casilla se guarda al tocarla; el usuario ve el cambio al recargar la página. Sin casillas marcadas no ve ninguna planilla.
          </p>
        </div>
        <AccesosForm inicial={accesos} />
      </section>
    </main>
  );
}
