"use client";

import { useState, useTransition, type ReactElement, type ReactNode } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/loading-dots";
import { SeleccionMultiple } from "@/components/seleccion-multiple";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { nombreCompleto } from "@/lib/auth/permisos";
import { actualizarUsuarioAction, crearUsuarioAction } from "../actions/usuario.actions";
import { ETIQUETA_ROL, PIN_RE, ROLES, type Rol, type Usuario, type UsuarioCambios, type UsuarioInput } from "../types/usuario.types";

export interface EstacionOpcion {
  id: string;
  nombre: string;
  activa: boolean;
}

const SELECT =
  "h-11 rounded-lg border border-input bg-background px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

const vacio = (): UsuarioInput => ({ nombre: "", apellido: "", pin: "", rol: "fabrica", estaciones_ids: [] });

const desdeUsuario = (u: Usuario): UsuarioInput => ({
  nombre: u.nombre,
  apellido: u.apellido ?? "",
  pin: u.pin ?? "",
  rol: u.rol,
  estaciones_ids: u.estaciones.map((e) => e.id),
});

function Campo({ etiqueta, className, children }: { etiqueta: string; className?: string; children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className ?? ""}`}>
      <span className="font-medium">{etiqueta}</span>
      {children}
    </label>
  );
}

/** Solo los campos que cambiaron (el PATCH no reescribe lo que no se tocó). */
function cambiosDe(antes: UsuarioInput, ahora: UsuarioInput): UsuarioCambios {
  const c: UsuarioCambios = {};
  if (ahora.nombre.trim() !== antes.nombre) c.nombre = ahora.nombre.trim();
  if (ahora.apellido.trim() !== antes.apellido) c.apellido = ahora.apellido.trim();
  if (ahora.pin !== antes.pin) c.pin = ahora.pin;
  if (ahora.rol !== antes.rol) c.rol = ahora.rol;
  const a = [...antes.estaciones_ids].sort().join();
  const b = [...ahora.estaciones_ids].sort().join();
  if (a !== b) c.estaciones_ids = ahora.estaciones_ids;
  return c;
}

// Alta y edición de un usuario (persona): nombre, apellido, PIN, rol y estaciones de trabajo. Con `soloPin`
// muestra solo el cambio de PIN. El backend valida igual (PIN único, nombre y apellido sin repetir, roles).
export function UsuarioDialog({
  usuario,
  estaciones,
  esAdmin,
  soloPin,
  esPropio,
  trigger,
}: {
  /** Con `usuario` se edita; sin él, se da de alta. */
  usuario?: Usuario;
  /** Todas las estaciones de trabajo (las inactivas solo se muestran si el usuario ya las tiene). */
  estaciones: EstacionOpcion[];
  /** Solo un admin puede dar o quitar el rol admin. */
  esAdmin: boolean;
  soloPin?: boolean;
  /** Es el usuario con la sesión iniciada: nadie puede cambiarse su propio rol. */
  esPropio?: boolean;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<UsuarioInput>(() => (usuario ? desdeUsuario(usuario) : vacio()));
  const [verPin, setVerPin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  // Un usuario nuevo nunca puede ser admin; al editar, solo un admin ve la opción (o si ya lo es).
  const roles = ROLES.filter((r) => r !== "admin" || (usuario !== undefined && (esAdmin || usuario.rol === "admin")));
  const opcionesEstacion = estaciones
    .filter((e) => e.activa || v.estaciones_ids.includes(e.id) || usuario?.estaciones.some((x) => x.id === e.id))
    .map((e) => ({ id: e.id, etiqueta: e.nombre, detalle: e.activa ? undefined : "inactiva" }));
  // Estaciones que el usuario tiene pero no vinieron en el listado (ej. sin permiso para ver estaciones).
  for (const e of usuario?.estaciones ?? []) {
    if (!opcionesEstacion.some((o) => o.id === e.id)) opcionesEstacion.push({ id: e.id, etiqueta: e.nombre, detalle: undefined });
  }

  function abrir(next: boolean) {
    if (pendiente) return;
    setOpen(next);
    if (next) {
      setV(usuario ? desdeUsuario(usuario) : vacio());
      setVerPin(true);
      setError(null);
    }
  }

  function validar(): string | null {
    if (!soloPin && !v.nombre.trim()) return "Falta el nombre.";
    if (!soloPin && !usuario && !v.apellido.trim()) return "Falta el apellido.";
    if (!PIN_RE.test(v.pin)) return "El PIN tiene que tener entre 4 y 10 números.";
    if (v.rol === "admin" && !esAdmin && usuario?.rol !== "admin") return "Solo un admin puede dar el rol admin.";
    return null;
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const invalido = validar();
    if (invalido) return setError(invalido);
    setError(null);
    startTransition(async () => {
      let r;
      if (!usuario) {
        r = await crearUsuarioAction({ ...v, nombre: v.nombre.trim(), apellido: v.apellido.trim() });
      } else {
        const cambios = soloPin ? (v.pin !== usuario.pin ? { pin: v.pin } : {}) : cambiosDe(desdeUsuario(usuario), v);
        if (Object.keys(cambios).length === 0) {
          setOpen(false);
          return;
        }
        r = await actualizarUsuarioAction(usuario.id, cambios);
      }
      if (!r.success) return setError(r.message);
      const quien = nombreCompleto({ nombre: v.nombre.trim(), apellido: v.apellido.trim() });
      toast.success(!usuario ? `${quien}: usuario creado.` : soloPin ? `${quien}: PIN cambiado.` : `${quien}: guardado.`);
      setOpen(false);
    });
  }

  const titulo = !usuario ? "Nuevo usuario" : soloPin ? `Cambiar PIN de ${nombreCompleto(usuario)}` : `Editar a ${nombreCompleto(usuario)}`;

  return (
    <Dialog open={open} onOpenChange={abrir}>
      <DialogTrigger render={trigger} />
      <DialogContent showCloseButton={false} className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={guardar} className="flex flex-col gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            <DialogDescription>
              {soloPin
                ? "El PIN es con lo que entra a la app. Tiene que tener entre 4 y 10 números y no puede ser el de otra persona."
                : "Cada persona entra a la app con su PIN (4 a 10 números, distinto del de los demás). Las estaciones definen qué planillas completa y qué estado marca en la planificación."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            {!soloPin && (
              <>
                <Campo etiqueta="Nombre">
                  <Input
                    value={v.nombre}
                    onChange={(e) => setV((p) => ({ ...p, nombre: e.target.value }))}
                    maxLength={60}
                    autoComplete="off"
                    className="h-11"
                    required
                  />
                </Campo>
                <Campo etiqueta="Apellido">
                  <Input
                    value={v.apellido}
                    onChange={(e) => setV((p) => ({ ...p, apellido: e.target.value }))}
                    maxLength={60}
                    autoComplete="off"
                    className="h-11"
                    required={!usuario}
                  />
                </Campo>
              </>
            )}
            <Campo etiqueta="PIN">
              <div className="flex gap-1.5">
                <Input
                  value={v.pin}
                  onChange={(e) => setV((p) => ({ ...p, pin: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  type={verPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="\d{4,10}"
                  maxLength={10}
                  autoComplete="off"
                  className="h-11 font-mono tracking-widest"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-11"
                  onClick={() => setVerPin((x) => !x)}
                  aria-label={verPin ? "Ocultar PIN" : "Mostrar PIN"}
                  title={verPin ? "Ocultar PIN" : "Mostrar PIN"}
                >
                  {verPin ? <EyeOffIcon /> : <EyeIcon />}
                </Button>
              </div>
            </Campo>
            {!soloPin && (
              <Campo etiqueta="Rol">
                <select
                  value={v.rol}
                  onChange={(e) => setV((p) => ({ ...p, rol: e.target.value as Rol }))}
                  disabled={esPropio}
                  title={esPropio ? "No podés cambiar tu propio rol." : undefined}
                  className={SELECT}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {ETIQUETA_ROL[r]}
                    </option>
                  ))}
                </select>
              </Campo>
            )}
          </div>

          {!soloPin && (
            <fieldset className="flex flex-col gap-1.5 text-sm">
              <legend className="mb-1 font-medium">Estaciones de trabajo</legend>
              <p className="text-xs text-muted-foreground">Opcional: técnica, gerencia y admin pueden no tener ninguna. Se pueden marcar varias.</p>
              <SeleccionMultiple
                opciones={opcionesEstacion}
                seleccion={v.estaciones_ids}
                onChange={(ids) => setV((p) => ({ ...p, estaciones_ids: ids }))}
                disabled={pendiente}
                vacio="Todavía no hay estaciones de trabajo (se crean en Termolaminado › Configurar)."
              />
            </fieldset>
          )}

          {error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" className="h-11 px-4" disabled={pendiente} onClick={() => abrir(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="h-11 px-5" disabled={pendiente}>
              {pendiente ? <LoadingDots /> : !usuario ? "Crear usuario" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
