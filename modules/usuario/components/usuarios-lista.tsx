"use client";

import { useMemo, useState } from "react";
import { EyeIcon, EyeOffIcon, KeyRoundIcon, PencilIcon, PlusIcon, UserCheckIcon, UserXIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { nombreCompleto } from "@/lib/auth/permisos";
import { actualizarUsuarioAction } from "../actions/usuario.actions";
import { etiquetaRol, type Usuario } from "../types/usuario.types";
import { UsuarioDialog, type EstacionOpcion } from "./usuario-dialog";

const SELECT =
  "h-11 rounded-lg border border-input bg-background px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

type FiltroActivo = "activos" | "inactivos" | "todos";
const SIN_ESTACION = "__sin__";

function ultimoAcceso(iso: string | null): string {
  if (!iso) return "Nunca";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

// Listado de personas (técnica / admin): filtro por estación, por activos y por nombre; PIN visible con opción de
// ocultarlo; alta, edición, cambio de PIN, baja y reactivación. Nadie puede darse de baja a sí mismo.
export function UsuariosLista({
  usuarios,
  estaciones,
  esAdmin,
  sesionId,
}: {
  usuarios: Usuario[];
  estaciones: EstacionOpcion[];
  esAdmin: boolean;
  sesionId: string;
}) {
  const [estacion, setEstacion] = useState("");
  const [activo, setActivo] = useState<FiltroActivo>("activos");
  const [texto, setTexto] = useState("");
  const [verPines, setVerPines] = useState(true);

  // Estaciones para el filtro: las del listado más las que aparecen en algún usuario.
  const opcionesFiltro = useMemo(() => {
    const m = new Map(estaciones.map((e) => [e.id, e.nombre]));
    for (const u of usuarios) for (const e of u.estaciones) if (!m.has(e.id)) m.set(e.id, e.nombre);
    return [...m].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [usuarios, estaciones]);

  const visibles = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return usuarios
      .filter((u) => (activo === "todos" ? true : activo === "activos" ? u.activo : !u.activo))
      .filter((u) => (!estacion ? true : estacion === SIN_ESTACION ? u.estaciones.length === 0 : u.estaciones.some((e) => e.id === estacion)))
      .filter((u) => !t || nombreCompleto(u).toLowerCase().includes(t))
      .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), "es"));
  }, [usuarios, activo, estacion, texto]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Estación</span>
          <select value={estacion} onChange={(e) => setEstacion(e.target.value)} className={SELECT}>
            <option value="">Todas</option>
            <option value={SIN_ESTACION}>Sin estación</option>
            {opcionesFiltro.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Estado</span>
          <select value={activo} onChange={(e) => setActivo(e.target.value as FiltroActivo)} className={SELECT}>
            <option value="activos">Activos</option>
            <option value="inactivos">Dados de baja</option>
            <option value="todos">Todos</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Buscar</span>
          <Input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nombre o apellido" autoComplete="off" className="h-11 w-52" />
        </label>
        <Button type="button" variant="outline" className="h-11 px-4" onClick={() => setVerPines((x) => !x)} aria-pressed={!verPines}>
          {verPines ? <EyeOffIcon /> : <EyeIcon />} {verPines ? "Ocultar PIN" : "Mostrar PIN"}
        </Button>
        <div className="ml-auto">
          <UsuarioDialog
            estaciones={estaciones}
            esAdmin={esAdmin}
            trigger={
              <Button className="h-11 px-4">
                <PlusIcon /> Nuevo usuario
              </Button>
            }
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {visibles.length} de {usuarios.length} usuario{usuarios.length === 1 ? "" : "s"}
      </p>

      <ul className="flex flex-col gap-2">
        {visibles.map((u) => {
          const yo = u.id === sesionId;
          const quien = nombreCompleto(u);
          return (
            <li key={u.id} className={`flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center ${u.activo ? "" : "bg-muted/40"}`}>
              <div className="grid flex-1 gap-x-4 gap-y-1 sm:grid-cols-[minmax(10rem,1.4fr)_7rem_minmax(8rem,2fr)_6rem]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{quien}</span>
                  {yo && <Badge variant="secondary">Vos</Badge>}
                  {!u.activo && <Badge variant="destructive">Dado de baja</Badge>}
                </div>
                <span className="text-sm">{etiquetaRol(u.rol)}</span>
                <span className="text-sm text-muted-foreground">
                  {u.estaciones.length > 0 ? u.estaciones.map((e) => e.nombre).join(", ") : "Sin estación"}
                </span>
                <span className="font-mono text-sm tracking-widest" aria-label={verPines ? `PIN ${u.pin}` : "PIN oculto"}>
                  {verPines ? u.pin : "••••"}
                </span>
                <span className="text-xs text-muted-foreground sm:col-span-4">Último acceso: {ultimoAcceso(u.ultimo_acceso)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <UsuarioDialog
                  usuario={u}
                  estaciones={estaciones}
                  esAdmin={esAdmin}
                  trigger={
                    <Button variant="outline" className="h-11 px-3">
                      <PencilIcon /> Editar
                    </Button>
                  }
                />
                <UsuarioDialog
                  usuario={u}
                  estaciones={estaciones}
                  esAdmin={esAdmin}
                  soloPin
                  trigger={
                    <Button variant="outline" className="h-11 px-3">
                      <KeyRoundIcon /> PIN
                    </Button>
                  }
                />
                {u.activo ? (
                  <ConfirmActionButton
                    variant="destructive"
                    className="h-11 px-3"
                    disabled={yo}
                    label={
                      <>
                        <UserXIcon /> Dar de baja
                      </>
                    }
                    title={`¿Dar de baja a ${quien}?`}
                    description="No va a poder entrar a la app con su PIN. No se borra: las planillas que completó conservan su nombre y se puede reactivar."
                    confirmLabel="Dar de baja"
                    successMessage={`${quien}: dado de baja.`}
                    errorTitle="No se pudo dar de baja"
                    run={() => actualizarUsuarioAction(u.id, { activo: false })}
                  />
                ) : (
                  <ConfirmActionButton
                    className="h-11 px-3"
                    label={
                      <>
                        <UserCheckIcon /> Reactivar
                      </>
                    }
                    title={`¿Reactivar a ${quien}?`}
                    description="Vuelve a poder entrar a la app con su PIN, con el rol y las estaciones que tenía."
                    confirmLabel="Reactivar"
                    successMessage={`${quien}: reactivado.`}
                    errorTitle="No se pudo reactivar"
                    run={() => actualizarUsuarioAction(u.id, { activo: true })}
                  />
                )}
              </div>
            </li>
          );
        })}
        {visibles.length === 0 && <li className="rounded-lg border p-4 text-sm text-muted-foreground">No hay usuarios con esos filtros.</li>}
      </ul>
    </div>
  );
}
