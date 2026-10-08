import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // diseño.md §10.2 — la tablet entra vía Caddy (HTTPS) a la IP LAN del
  // servidor, no a "localhost" (con el que arrancó `next dev`). Sin esto,
  // Next.js rechaza en dev los pedidos a assets/endpoints cuyo Origin no
  // coincide con el host de arranque (docs: allowedDevOrigins).
  // Toda la red de la fábrica (192.168.3.x), así no hay que tocar esto cuando
  // DHCP cambia la IP de la PC. OJO: un "*" suelto NO sirve como comodín total
  // — en esta versión de Next reemplaza UNA sola etiqueta del hostname, y una
  // IP tiene cuatro (con "*" el dev server bloquea los recursos de desarrollo
  // y la página carga pero no responde: botones muertos, cámara en negro).
  // Si la red de la fábrica cambia de rango, ajustar el patrón.
  allowedDevOrigins: ["192.168.3.*"],
  // Defensa adicional para Server Actions: Caddy ya reenvía x-forwarded-host
  // (con lo cual esto no debería hacer falta), pero se deja explícito.
  experimental: {
    serverActions: {
      allowedOrigins: ["192.168.3.*"],
    },
  },
};

export default nextConfig;
