import { redirect } from "next/navigation";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { EscanerCamara } from "@/modules/pieza/components/escaner-camara";

export default async function EscaneoPage() {
  if (!puede(await requireSesion(), PERMISOS.PIEZAS_MARCAR)) redirect("/");
  return (
    <div className="h-dvh w-full">
      <EscanerCamara />
    </div>
  );
}
