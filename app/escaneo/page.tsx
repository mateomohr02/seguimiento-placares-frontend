import { redirect } from "next/navigation";
import { getClaveSesion, requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { EscanerCamara } from "@/modules/pieza/components/escaner-camara";

export default async function EscaneoPage() {
  if (!puede(await requireSesion(), PERMISOS.PIEZAS_MARCAR)) redirect("/");
  const sesion = await getClaveSesion();
  if (!sesion) redirect("/login");
  return (
    <div className="h-[calc(100dvh-var(--barra-h))] w-full">
      <EscanerCamara claveSesion={sesion.clave} expiraEn={sesion.expiraEn} />
    </div>
  );
}
