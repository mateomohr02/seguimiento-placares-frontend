import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { HojaCorteVisor } from "@/modules/hoja-corte/components/hoja-corte-visor";
import { fechaCorta } from "@/modules/planilla/lib/estaciones";
import { ETIQUETA_TIPO, esImagen, type PlanificacionDoc } from "@/modules/planificacion/types/planificacion.types";

export default async function PlanificacionVisorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sesion = await requireSesion();
  if (!puede(sesion, PERMISOS.DOCUMENTACION_VER)) notFound();
  const doc = (await apiFetch<PlanificacionDoc[]>("/planificacion")).find((d) => d.id === id);
  if (!doc) notFound();

  return (
    <HojaCorteVisor
      anotacionesUrl={`/planificacion/${doc.id}/anotaciones`}
      src={`/planificacion/${doc.id}/archivo`}
      tipoArchivo={esImagen(doc.mime) ? "imagen" : "pdf"}
      titulo={`${ETIQUETA_TIPO[doc.tipo]} — semana del ${fechaCorta(doc.semana_inicio)}`}
      volverHref="/planificacion"
    />
  );
}
