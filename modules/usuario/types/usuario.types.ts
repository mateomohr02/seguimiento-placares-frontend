// Personas que usan la app (operarios, técnica, gerencia, admin) — espejo de GET /usuarios del backend.
// El login es solo por PIN; un usuario no se borra, se desactiva (activo = false).
export type Rol = "fabrica" | "tecnica" | "gerencia" | "admin";

export const ROLES: Rol[] = ["fabrica", "tecnica", "gerencia", "admin"];

export const ETIQUETA_ROL: Record<Rol, string> = {
  fabrica: "Fábrica",
  tecnica: "Técnica",
  gerencia: "Gerencia",
  admin: "Admin",
};

export const etiquetaRol = (rol: string) => ETIQUETA_ROL[rol as Rol] ?? rol;

export interface EstacionDeUsuario {
  id: string;
  nombre: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  activo: boolean;
  /** Técnica ve los PIN (se guardan en texto plano, decisión vieja). */
  pin: string;
  ultimo_acceso: string | null;
  estaciones: EstacionDeUsuario[];
}

/** Alta (POST /usuarios). */
export interface UsuarioInput {
  nombre: string;
  apellido: string;
  pin: string;
  rol: Rol;
  estaciones_ids: string[];
}

/** Edición (PATCH /usuarios/:id): solo los campos que cambian. */
export type UsuarioCambios = Partial<UsuarioInput & { activo: boolean }>;

/** PIN numérico de 4 a 10 dígitos (el backend lo valida igual y además exige que sea único). */
export const PIN_RE = /^\d{4,10}$/;
