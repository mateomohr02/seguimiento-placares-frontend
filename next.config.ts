import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // diseño.md §10.2 — la tablet entra vía Caddy (HTTPS) a la IP LAN del
  // servidor, no a "localhost" (con el que arrancó `next dev`). Sin esto,
  // Next.js rechaza en dev los pedidos a assets/endpoints cuyo Origin no
  // coincide con el host de arranque (docs: allowedDevOrigins).
  // IP LAN actual del servidor — cambia si DHCP reasigna la IP (conviene
  // fijar una reserva DHCP o IP estática, diseño.md §10.3).
  allowedDevOrigins: ["192.168.3.179"],
  // Defensa adicional para Server Actions: Caddy ya reenvía x-forwarded-host
  // (con lo cual esto no debería hacer falta), pero se deja explícito.
  experimental: {
    serverActions: {
      allowedOrigins: ["192.168.3.179"],
    },
  },
};

export default nextConfig;
