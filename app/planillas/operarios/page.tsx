import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { OperariosForm } from "@/modules/planilla/components/operarios-form";
import type { OperariosArea } from "@/modules/planilla/types/planilla.types";

export default async function OperariosPage() {
  const sesion = await requireSesion();
  if (!puede(sesion, PERMISOS.PLANILLAS_CONFIGURAR)) notFound();
  const { operarios } = await apiFetch<OperariosArea>("/planillas/operarios");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">Operarios de Termolaminado</h1>
        <p className="text-sm text-muted-foreground">
          Estos nombres salen en el encabezado de las planillas de Lijado, Encolado y PVC. Las planillas que ya se crearon conservan los nombres que tenían.
        </p>
      </div>
      <OperariosForm inicial={operarios} />
    </main>
  );
}
