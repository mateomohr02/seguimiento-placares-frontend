# Frontend — Seguimiento de placares

La interfaz web que usan **logística** (ver el progreso de las órdenes) y el **operario de la máquina Rover** (escanear piezas cortadas). Habla con el [backend](../backend/README.md) por HTTP — nunca accede a TeoWin ni a la base de datos directamente.

> Si nunca tocaste este proyecto, empezá por **"Cómo levantarlo"**. El resto es referencia.

---

## Índice

1. [Stack tecnológico](#stack-tecnológico)
2. [Estructura de carpetas](#estructura-de-carpetas)
3. [Variables de entorno](#variables-de-entorno)
4. [Cómo levantarlo](#cómo-levantarlo)
5. [Cámara y HTTPS — por qué hace falta Caddy](#cámara-y-https--por-qué-hace-falta-caddy)
6. [Manual de usuario, vista por vista](#manual-de-usuario-vista-por-vista)
7. [Diseño visual](#diseño-visual)
8. [Problemas comunes](#problemas-comunes)

---

## Stack tecnológico

| Pieza | Qué es | Por qué se eligió |
|---|---|---|
| **Next.js** (App Router) | Framework de React que corre tanto en el servidor como en el navegador | Permite que las páginas carguen datos del backend del lado del servidor (más simple y más seguro que hacerlo todo desde el navegador) |
| **TypeScript** | JavaScript con tipos | Menos errores tontos |
| **shadcn/ui** | Componentes de interfaz (botones, tablas, diálogos) ya armados | No hay que reinventar cada componente visual desde cero |
| **Tailwind CSS** | Estilos por clases utilitarias | Rápido de escribir y de mantener consistente |
| **React Hook Form + Zod** | Formularios y su validación | Un solo lugar define qué es un dato válido |
| **@zxing/browser** | Lectura de códigos de barras usando la cámara del navegador | Es lo que permite escanear sin un lector físico dedicado |
| **Caddy** | Servidor que agrega HTTPS por delante de esta app | La cámara del navegador **no funciona sin HTTPS** — ver la sección dedicada más abajo |

---

## Estructura de carpetas

```
app/frontend/
├── app/                        # Cada carpeta acá adentro es una URL (App Router de Next.js)
│   ├── page.tsx                 # "/"            → Vista 1: listado de órdenes
│   ├── ordenes/[id]/page.tsx     # "/ordenes/<uuid>"  → Vista 2: pedidos de una orden
│   ├── pedidos/[id]/page.tsx     # "/pedidos/<uuid>"  → Vista 3: módulos de un pedido
│   ├── modulos/[id]/page.tsx     # "/modulos/<uuid>"  → Vista 4: piezas de un módulo
│   ├── escaneo/page.tsx          # "/escaneo"      → Vista 5: cámara para escanear
│   └── layout.tsx                # Estructura común a todas las páginas (fuente, tema, notificaciones)
├── modules/                     # Un módulo por concepto de negocio (igual criterio que el backend)
│   ├── orden/
│   ├── pedido/
│   ├── modulo/
│   └── pieza/
├── components/
│   ├── ui/                       # Componentes genéricos de shadcn/ui (botón, tabla, diálogo...) sin lógica de negocio
│   └── estado-badge.tsx           # La "etiqueta" de color que muestra el estado (Pendiente/En proceso/Finalizado...)
├── lib/api/api-client.ts          # El único lugar del código que hace fetch() hacia el backend
└── .env.local / .env.example
```

Dentro de cada `modules/<algo>/` vas a encontrar siempre:

```
<algo>/
├── types/         # La forma de los datos (TypeScript)
├── schemas/         # Validación de formularios (Zod)
├── actions/           # Funciones que llaman al backend para crear/modificar algo (Server Actions de Next.js)
└── components/         # Las piezas de interfaz de ese módulo (tablas, botones, diálogos)
```

**Regla importante**: ningún componente llama `fetch()` directamente — todo pasa por `lib/api/api-client.ts` o por una `action`. Eso hace que, si el día de mañana cambia cómo se llama al backend (por ejemplo, se agrega autenticación), solo hay que tocar un lugar.

---

## Variables de entorno

Copiá `.env.example` a `.env.local` y completá:

| Variable | Para qué sirve | Ejemplo |
|---|---|---|
| `API_URL` | Dónde está el backend | `http://localhost:4000/api` |

Este proyecto no tiene login todavía, así que no hay nada más que configurar acá. `API_URL` **no** lleva el prefijo `NEXT_PUBLIC_` a propósito: solo se usa del lado del servidor (páginas y Server Actions), nunca desde el navegador — así el backend no queda expuesto directamente a quien abra las herramientas de desarrollador del navegador.

---

## Cómo levantarlo

Necesitás el [backend](../backend/README.md) corriendo primero (en otra terminal).

```powershell
cd app\frontend
npm install       # solo la primera vez, o cuando cambien las dependencias
npm run dev       # levanta el servidor de desarrollo
```

Vas a ver `Ready` y la URL `http://localhost:3000`. Con eso ya podés abrir la app **desde esta misma PC**.

Si necesitás usar la cámara (Vista 5) desde una **tablet**, hace falta un paso extra — seguí leyendo.

---

## Cámara y HTTPS — por qué hace falta Caddy

Los navegadores **bloquean el acceso a la cámara** en cualquier página que no esté servida por HTTPS (con la única excepción de `http://localhost`, que cuenta como "seguro" aunque no tenga HTTPS — por eso desde esta PC funciona sin nada extra). Una tablet entrando por la IP de la red local (`http://192.168.x.x:3000`) **nunca** va a poder prender la cámara, sin importar qué tan bien esté programado el resto de la app.

La solución: **Caddy**, un servidor liviano que se pone "delante" de esta app y le agrega HTTPS con un certificado autofirmado (válido para uso interno, no necesita ser de una autoridad pública).

### Cómo levantarlo

```powershell
cd infra
& "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\CaddyServer.Caddy_Microsoft.Winget.Source_8wekyb3d8bbwe\caddy.exe" run --config Caddyfile
```

(El [`Caddyfile`](../../infra/Caddyfile) está en la raíz del proyecto, no acá en el frontend, porque en el futuro también va a servir para el backend en el servidor de producción.)

Con Caddy corriendo (y el backend + frontend también corriendo), desde la tablet entrás por:

```
https://<IP de esta PC>/
```

La primera vez, el navegador de la tablet va a avisar que el certificado no es de una autoridad conocida (es autofirmado) — hay que tocar "Avanzado" → "Continuar de todos modos" **una sola vez**. Después de eso, la cámara funciona con normalidad.

### ⚠️ La IP de esta PC puede cambiar

Si la red le asigna la IP por DHCP (lo más común), puede cambiar cada vez que la PC se reconecta a la red. Cuando eso pasa, hay que actualizar **dos archivos**:

1. [`infra/Caddyfile`](../../infra/Caddyfile) — el dominio/IP que Caddy sirve.
2. [`next.config.ts`](next.config.ts) — `allowedDevOrigins` y `serverActions.allowedOrigins` (si no coinciden con la IP real, la app carga pero **las acciones como escanear o agregar una orden fallan silenciosamente** — es un mecanismo de seguridad de Next.js en modo desarrollo, no un bug).

Después de cambiar `next.config.ts` hay que **reiniciar** `npm run dev` (ese archivo no se recarga solo). Después de cambiar el `Caddyfile`, alcanza con recargarlo sin reiniciar el proceso:

```powershell
& "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\CaddyServer.Caddy_Microsoft.Winget.Source_8wekyb3d8bbwe\caddy.exe" reload --config infra\Caddyfile
```

Para evitar este problema de raíz, lo ideal es pedir una **IP fija o una reserva DHCP** para esta PC en el router/switch de la fábrica (así la IP nunca cambia).

---

## Manual de usuario, vista por vista

### Vista 1 — Listado de órdenes (`/`)

La pantalla principal. Muestra una tabla con todas las órdenes de fabricación que ya se sincronizaron desde TeoWin: número de orden, descripción, cantidad de pedidos y estado.

- **Botón "Agregar orden"**: abre un formulario para escribir el número de orden de fabricación (el que aparece impreso en la etiqueta de corte, ej. `263.500.002` → se escribe `263500002`). Al confirmar, trae desde TeoWin todos los pedidos, módulos y piezas de esa orden. Si el número no existe en TeoWin, o ya estaba cargado, avisa con un mensaje claro.
- **Botón "Escanear"**: lleva a la Vista 5 (cámara).
- Click en el número de orden o en la descripción → entra a la Vista 2 de esa orden.

### Vista 2 — Pedidos de una orden (`/ordenes/:id`)

Los pedidos que forman parte de la orden seleccionada: número de pedido, cliente/referencia, cantidad de módulos y estado.

- Click en el número de pedido o en el cliente → entra a la Vista 3 de ese pedido.
- **Botón "Marcar finalizado"** por fila: lo usa logística para confirmar a mano que ese pedido ya está completo. Cuando **todos** los pedidos de una orden quedan finalizados, la orden pasa sola a "Lista".

### Vista 3 — Módulos de un pedido (`/pedidos/:id`)

Los módulos (muebles) de ese pedido: id, descripción, cantidad de piezas y estado.

- Click en el id o en la descripción → entra a la Vista 4 de ese módulo.
- **Botón "Marcar finalizado"** por fila: confirmación manual, igual que en pedidos.

### Vista 4 — Piezas de un módulo (`/modulos/:id`)

El detalle más fino: cada pieza física de ese módulo, con su código de barras, nombre de artículo, color, medidas y estado individual (Pendiente / Cortada).

- **Botón "Marcar finalizado"** por pieza: marca esa pieza como cortada a mano. Se usa para piezas que **nunca pasan por el escaneo de Rover** (fondos, tapajuntas) — es la única forma de darlas por resueltas.

### Vista 5 — Escaneo (`/escaneo`)

Pantalla completa pensada para tablet, con la cámara ocupando toda la pantalla ("modo continuo": no hay que tocar nada entre un escaneo y otro, la cámara queda siempre escuchando).

- Apunta la cámara al código de barras de la etiqueta de corte (siempre 7 dígitos).
- Al reconocer un código válido, aparece abajo un cartel con el resumen: qué pieza es, de qué módulo, pedido y orden — y automáticamente:
  - Esa pieza pasa a "Cortada".
  - Si era la primera pieza escaneada de ese módulo/pedido/orden, todos suben de "Pendiente" a "En producción" (o "En proceso" en el caso de la orden).
- Si el código no corresponde a ninguna pieza (o pertenece a una orden que fue descartada), aparece un cartel de error en vez del resumen — la cámara sigue funcionando, no hay que reiniciar nada.
- **Botón "Volver"** (esquina superior izquierda, siempre visible sobre la imagen de la cámara): vuelve a la Vista 1.

---

## Diseño visual

Los colores de la app están tomados de la identidad de [Neostone](https://neostone.com.ar/): una base neutra de grises carbón/blanco con un rojo de acento (`#DE0A0A`) reservado para botones y elementos activos — los estados "terminado" (Finalizado/Cortada/Lista) usan un gris neutro con un ícono de check en vez del rojo, para que no se lean como una alerta.

Los tokens de color están en [`app/globals.css`](app/globals.css) (variables `--primary`, `--background`, etc., en formato `oklch`), y valen tanto para modo claro como oscuro.

---

## Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| La página carga pero la lista de órdenes tira error, o no carga nada | El backend no está corriendo, o `API_URL` en `.env.local` no apunta a donde está | Confirmá que `npm run dev` del backend esté corriendo y que responda en `http://localhost:4000/api/health` |
| Desde la tablet, la cámara no se activa nunca (mensaje "requiere HTTPS") | Estás entrando por HTTP directo al puerto 3000 (`http://192.168.x.x:3000`) en vez de por Caddy | Entrá por `https://<IP>/` (sin `:3000`, con `https://`) — ver [Cámara y HTTPS](#cámara-y-https--por-qué-hace-falta-caddy) |
| La cámara se activa un segundo y se corta | Es un efecto de "Strict Mode" de React en modo desarrollo (monta y desmonta el componente dos veces para detectar fugas) — ya está resuelto en el código actual con un pequeño retraso al pedir la cámara, pero si volvés a ver esto después de tocar `escaner-camara.tsx`, es la primera sospecha | Revisar `modules/pieza/components/escaner-camara.tsx` |
| Agregar una orden o escanear una pieza no hace nada, sin error visible | La IP de la PC cambió y `next.config.ts` todavía tiene la vieja (bloqueo silencioso de seguridad de Next.js) | Actualizar `allowedDevOrigins` en `next.config.ts` con la IP actual y reiniciar `npm run dev` |
| El certificado de HTTPS no es de confianza | Es autofirmado, a propósito (no hace falta pagar/gestionar un certificado público para una red interna) | Aceptar el aviso del navegador una vez por dispositivo |
