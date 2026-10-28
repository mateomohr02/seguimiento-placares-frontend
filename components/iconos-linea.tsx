import type { SVGProps } from "react";

// Íconos propios (lucide-react no trae horno ni armario). Mismo estilo que lucide: 24x24, trazo 2, color heredado.
function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

/** Horno (cocinas): cuerpo, panel de perillas, ventana y manija. */
export function HornoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 8h18" />
      <path d="M7 5.5h.01" />
      <path d="M11 5.5h.01" />
      <rect x="6" y="11" width="12" height="7" rx="1" />
      <path d="M9 13.5h6" />
    </Base>
  );
}

/** Armario de dos puertas (placares): cuerpo, división central, tiradores y patas. */
export function ArmarioIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="4" y="2" width="16" height="18" rx="1" />
      <path d="M12 2v18" />
      <path d="M9.5 10.5v3" />
      <path d="M14.5 10.5v3" />
      <path d="M6 20v2" />
      <path d="M18 20v2" />
    </Base>
  );
}
