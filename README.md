# Frontend — Seguimiento de placares

La interfaz web que usan **logística** (ver el progreso de las órdenes) y el **operario de la máquina Rover** (escanear piezas cortadas). Habla con el [backend](../backend/README.md) por HTTP — nunca accede a TeoWin ni a la base de datos directamente. Además de seguir la producción, sirve para **consultar y anotar la documentación digital**: hojas de corte por orden, y nota de pedido, remisión, listados y planos por pedido.

> Si nunca tocaste este proyecto, empezá por **"Cómo levantarlo"**. El resto es referencia.

---

## Índice

1. [Stack tecnológico](#stack-tecnológico)
2. [Estructura de carpetas](#estructura-de-carpetas)
3. [Variables de entorno](#variables-de-entorno)
4. [Cómo levantarlo](#cómo-levantarlo)
5. [Cámara y HTTPS — por qué hace falta Caddy](#cámara-y-https--por-qué-hace-falta-caddy)
6. [Manual de usuario, vista por vista](#manual-de-usuario-vista-por-vista)
7. [Documentación digital y anotaciones](#documentación-digital-y-anotaciones)
8. [Diseño visual](#diseño-visual)
9. [Problemas comunes](#problemas-comunes)

---

## Stack tecnológico

| Pieza | Qué es | Por qué se eligió |
|---|---|---|
| **Next.js** (App Router) | Framework de React que corre tanto en el servidor como en el navegador | Permite que las páginas carguen datos del backend del lado del servidor (más simple y más seguro que hacerlo todo desde el navegador) |
| **TypeScript** | JavaScript con tipos | Menos errores tontos |
| **shadcn/ui** | Componentes de interfaz (botones, tablas, diálogos) ya armados | No hay que reinventar cada componente visual desde cero |
| **Tailwind CSS** | Estilos por clases utilitarias | Rápido de escribir y de mantener consistente |
| **React Hook Form + Zod** | Formularios y su validación | Un solo lugar define qué es un dato válido |
| **pdfjs-dist** (pdf.js) | Dibuja los PDF en la pantalla (en un `<canvas>`) | Los navegadores de las tablets no muestran PDFs embebidos de forma confiable (iOS Safari solo la primera hoja, Android Chrome ninguna). Se usa la build *legacy* para que funcione en navegadores viejos |
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
│   ├── ordenes/[id]/hojas-corte/  # Hojas de corte: lista + carga (page.tsx), visor ([hojaId]/page.tsx) y proxy de subida (subir/route.ts)
│   ├── pedidos/[id]/documentos/[docId]/page.tsx  # Visor de un documento del pedido (+ documentos/subir/route.ts, proxy de subida)
│   ├── pedidos/[id]/planos/[planoId]/page.tsx    # Visor de un plano (+ planos/subir/route.ts)
│   ├── hojas-corte/[id]/ · documentos-pedido/[id]/ · planos-pedido/[id]/   # Route handlers: proxys de /archivo y /anotaciones hacia el backend (el navegador no habla con el backend)
│   ├── red/estado/route.ts       # Endpoint que consulta el comprobador de red (responde si el frontend y el backend están vivos)
│   ├── loading.tsx               # Pantalla de carga (tres puntos) mientras una página pide sus datos
│   └── layout.tsx                # Estructura común a todas las páginas (fuente, tema, notificaciones)
├── modules/                     # Un módulo por concepto de negocio (igual criterio que el backend)
│   ├── orden/
│   ├── pedido/
│   ├── modulo/
│   ├── pieza/
│   ├── hoja-corte/                # Visor de PDF/imágenes (hoja-corte-visor.tsx), capa de anotaciones, barra de herramientas, hook use-anotaciones. Lo reutilizan documentos y planos
│   ├── documento-pedido/          # Documentación del pedido: tipos, carga con verificación (lib/analizar-pdf.ts), listado
│   ├── plano-pedido/              # Planos del pedido: carga, miniaturas, listado
│   └── auth/                       # Login por PIN: acción de login/logout y pantalla con teclado numérico
├── components/
│   ├── ui/                       # Componentes genéricos de shadcn/ui (botón, tabla, diálogo...) sin lógica de negocio
│   ├── estado-badge.tsx           # La "etiqueta" de color del estado: Pendiente (outline blanco), En proceso/En producción (bronce), Finalizado/Cortada/Lista (verde)
│   ├── confirm-action-button.tsx  # Botón + diálogo Aceptar/Cancelar. TODA acción que modifica datos pasa por acá (con `requireText`, además exige tipear una palabra)
│   ├── column-filter.tsx           # Filtro de columna estilo Excel (lista de valores con checkbox + búsqueda)
│   ├── network-guard.tsx           # Comprobador de red: cubre la app con un aviso si el dispositivo no llega al servidor
│   └── loading-dots.tsx            # Tres puntos que crecen y se achican (carga de páginas y botones)
├── proxy.ts                        # Puerta de entrada: sin sesión vigente, todo redirige a /login (salvo /login y /red/estado)
├── app/login/page.tsx              # Pantalla de PIN
├── lib/api/api-client.ts          # El único lugar del código del *servidor* que hace fetch() hacia el backend (JSON). Reenvía el token de sesión; un 401 redirige a /login
├── lib/api/proxy-json.ts          # Reenvía pedidos JSON del navegador al backend (anotaciones), con el token de sesión
├── lib/auth/                       # permisos.ts (claves de permiso y `puede()`), sesion.ts (cookie, getSesion, requireSesion, authHeaders)
├── lib/pdfjs.ts                   # Carga perezosa de pdf.js (solo en el navegador) y su worker
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

Las tablas con acciones tienen un componente `*-acciones.tsx` (`orden-acciones`: archivar y eliminar; `pieza-acciones`: finalizar y volver a pendiente) con los botones de su fila; todos se construyen con `ConfirmActionButton`. Módulos y pedidos son de solo lectura.

**Regla importante**: ningún componente llama al backend directamente — del lado del servidor todo pasa por `lib/api/api-client.ts` o por una `action`. Eso hace que, si el día de mañana cambia cómo se llama al backend, solo hay que tocar un lugar (la autenticación por PIN ya se resolvió ahí: `api-client.ts` agrega el token de la sesión).

**Excepción deliberada (documentación digital)**: el navegador necesita pedir PDFs/imágenes y guardar anotaciones sin pasar por un Server Action (los Server Actions limitan el cuerpo a 1 MB y los archivos pesan más). Para eso hay *route handlers* de Next.js (`app/hojas-corte/…`, `app/documentos-pedido/…`, `app/planos-pedido/…` y los `subir/route.ts`) que actúan de **proxy**: el navegador le habla al frontend por `fetch('/…')` y el frontend le habla al backend. El backend nunca se expone directo (Caddy solo publica el frontend). Si algún día se agrega autenticación, esos route handlers son el segundo lugar a tocar.

---

## Variables de entorno

Copiá `.env.example` a `.env.local` y completá:

| Variable | Para qué sirve | Ejemplo |
|---|---|---|
| `API_URL` | Dónde está el backend | `http://localhost:4000/api` |

El login (PIN) no necesita variables acá: las claves (`PIN_PEPPER`, `SESSION_SECRET`) viven solo en el `.env` del backend. `API_URL` **no** lleva el prefijo `NEXT_PUBLIC_` a propósito: solo se usa del lado del servidor (páginas y Server Actions), nunca desde el navegador — así el backend no queda expuesto directamente a quien abra las herramientas de desarrollador del navegador.

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

### ⚠️ La IP de esta PC cambió: paso a paso

Si la red le asigna la IP por DHCP (lo más común), la IP puede cambiar cada vez que la PC se reconecta. La IP está escrita en **dos archivos** y hay que actualizar ambos; si queda una IP vieja, la app falla de una de estas formas:

| Síntoma | Qué quedó con la IP vieja |
|---|---|
| La tablet no abre `https://<IP>/` (no responde o "conexión no privada" sin opción de continuar) | [`infra/Caddyfile`](../../infra/Caddyfile) |
| La página carga pero **los botones no responden, escanear o agregar una orden no hace nada, o la cámara queda en negro** | [`next.config.ts`](next.config.ts): `allowedDevOrigins` no cubre la IP (bloqueo de seguridad de Next.js, no es un bug). Se ve en la terminal del frontend como `Blocked cross-origin request to Next.js dev resource` |

Todos los comandos se corren en PowerShell **parados en la carpeta raíz del proyecto** (`seguimiento-placares`).

**1. Averiguar la IP nueva de la PC**

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object InterfaceAlias, IPAddress
```

Usá la que figura en el adaptador conectado a la red de la fábrica (típicamente `Ethernet` o `Wi-Fi`, algo como `192.168.3.xxx`). Si hay más de una, es la que la tablet puede alcanzar. (También sirve `ipconfig` → "Dirección IPv4".) En los pasos siguientes, `192.168.3.NNN` es la IP **nueva**.

**2. Actualizar el Caddyfile** — [`infra/Caddyfile`](../../infra/Caddyfile)

Cambiá la IP en la línea del sitio (y, si querés, en el comentario de arriba). `localhost` se deja:

```
localhost, 192.168.3.NNN {
	tls internal
	reverse_proxy localhost:3000
}
```

Tiene que figurar **la IP explícita** (no un `:443` genérico): con ella Caddy emite el certificado para esa IP.

**3. Actualizar `next.config.ts`** — [`next.config.ts`](next.config.ts)

**Normalmente no hace falta tocarlo**: el archivo ya permite toda la red de la fábrica con un patrón por rango, así que mientras la IP siga siendo `192.168.3.x` este paso se saltea:

```ts
allowedDevOrigins: ["192.168.3.*"],
// ...
serverActions: { allowedOrigins: ["192.168.3.*"] },
```

Solo hay que editarlo si la PC pasa a otro rango (por ejemplo `192.168.10.x`: usar `"192.168.10.*"`) — en ese caso hay que reiniciar `npm run dev` (paso 5).

> ⚠️ **No usar un `"*"` suelto.** En esta versión de Next un `*` reemplaza **una sola** etiqueta del nombre de host, y una IP tiene cuatro (`192.168.3.167`), así que `"*"` no la cubre. Con eso el dev server bloquea sus recursos de desarrollo desde la tablet (en la terminal aparece `Blocked cross-origin request to Next.js dev resource /_next/hmr from "192.168.3.x"`): la página carga, pero **los botones no responden y la cámara queda en negro**, porque el JavaScript no se activa. El patrón correcto es el de arriba, con la IP completa o con `*` reemplazando solo el último número.

**4. Validar y recargar Caddy** (sin reiniciarlo ni cortar nada)

Correlo desde la **carpeta raíz del proyecto** (`seguimiento-placares`, no desde `app\frontend`), porque `infra\Caddyfile` es una ruta relativa a ella:

```powershell
cd "C:\Users\Usuario\Desktop\Claude Projects\seguimiento-placares"
$caddy = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\CaddyServer.Caddy_Microsoft.Winget.Source_8wekyb3d8bbwe\caddy.exe"
& $caddy validate --config infra\Caddyfile --adapter caddyfile
& $caddy reload --config infra\Caddyfile
```

Debe decir `Valid configuration`. Los renglones rojos con `"level":"info"` que aparecen en PowerShell son solo el log de Caddy, no un error. Si Caddy no estaba corriendo, levantalo como se explica más arriba (`caddy run --config Caddyfile`, ahí sí desde la carpeta `infra`).

**5. Reiniciar el frontend** — `next.config.ts` no se recarga solo

En la terminal donde corre `npm run dev` (carpeta `app\frontend`): `Ctrl + C` y volver a correr:

```powershell
npm run dev
```

El backend no necesita reinicio.

**6. Comprobar desde la PC**

```powershell
curl.exe -k -s -o NUL -w "HTTP %{http_code}`n" https://192.168.3.NNN/
```

Debe dar `HTTP 200`. Si da `502`, falta levantar el frontend (paso 5); si no responde, revisá el Caddyfile (paso 2) y que el puerto 443 esté abierto en el firewall de Windows (`New-NetFirewallRule -DisplayName "Caddy HTTPS 443" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow`, una sola vez, como administrador).

**7. En cada tablet: aceptar el certificado de la IP nueva**

Entrá por `https://192.168.3.NNN/`. Como el certificado es autofirmado y ahora es para otra IP, el navegador vuelve a avisar: **"Avanzado" → "Continuar de todos modos"** (una sola vez por tablet). Después la cámara y el escaneo funcionan igual. Conviene actualizar el acceso directo / marcador de la tablet con la IP nueva.

**8. Prueba final**: agregá o abrí una orden y escaneá una pieza desde la tablet. Si la página carga pero no pasa nada al escanear o agregar, repasá el paso 3 y que se haya reiniciado `npm run dev` (paso 5).

**Para no repetir esto: reserva DHCP o IP fija.** Pedirle a sistemas que reserven en el router/switch de la fábrica la IP de esta PC (por su dirección MAC) hace que la IP nunca más cambie, y no hay que volver a tocar ninguno de los dos archivos ni re-aceptar el certificado en las tablets. Es la solución de fondo; este paso a paso es solo el parche cuando la IP ya cambió.

---

## Manual de usuario, vista por vista

### Ingreso con PIN y roles

Al abrir la app aparece la pantalla de **PIN** (teclado numérico en pantalla; con teclado físico también sirve, con Enter para ingresar). El PIN identifica al usuario: una persona o una estación de trabajo (`rover1`, `cortadora1`, …). Con un PIN incorrecto avisa y limpia el campo; tras 8 errores seguidos se bloquea unos minutos.

- La sesión dura **12 horas** (configurable en el backend) y se guarda en una cookie que el navegador no puede leer. Arriba a la derecha del listado de órdenes se ve **quién está conectado y su rol**, con el botón **Salir**. Si la sesión vence, o si dan de baja al usuario mientras la usa, la app lo manda otra vez al ingreso de PIN.
- Los usuarios, roles y permisos **se administran en la base** (ver el [README del backend](../backend/README.md#9-usuarios-roles-y-permisos)); no hay pantalla de administración.
- **La app muestra solo lo que el rol puede hacer** (y el backend lo vuelve a validar en cada acción):

| Rol | Qué ve y qué puede hacer |
|---|---|
| `admin` / `tecnica` | Todo: agregar, archivar y eliminar órdenes; escanear y marcar piezas; subir y eliminar documentación; anotar y borrar anotaciones |
| `fabrica` (estaciones) | Ver órdenes, pedidos, módulos, despieces y documentación; **Escanear** y **Finalizado / Pendiente** por pieza; **anotar** sobre los documentos (pero **sin** Borrar ni Deshacer). No ve "Agregar orden", Archivar ni Eliminar, ni subir/eliminar documentos |
| `gerencia` | Solo lectura: no ve "Escanear" (entrar a `/escaneo` lo devuelve al listado), ni botones de piezas, ni "Anotar", ni subir/eliminar |

### Aviso de red

La app exige que el dispositivo esté en la red de Neostone SA. Como un navegador no puede leer el nombre del Wi-Fi, lo que se comprueba es que el servidor sea alcanzable: cada 5 segundos la app consulta `/red/estado`, y tras 2 fallos seguidos cubre toda la pantalla con un aviso hasta que vuelva la conexión (se recupera sola):

- **"No estás conectado a la red de Neostone SA"**: el dispositivo no llega al servidor (Wi-Fi caído, otra red).
- **"No se puede comunicar con el servidor"**: el dispositivo llega al frontend pero el backend no responde.

No valida desde qué red entra el dispositivo (una VPN o datos móviles que lleguen al servidor pasarían). Ver `components/network-guard.tsx`.

### Confirmación en cada acción

Todo botón que modifica datos (finalizar o volver a pendiente una pieza, archivar, eliminar una orden) abre primero un diálogo con **Cancelar** / **Aceptar**. La acción recién se ejecuta al aceptar; mientras corre, el botón muestra los tres puntos animados. Si el backend la rechaza, aparece un aviso con el motivo. Eliminar una orden pide además escribir la palabra `confirmar`.

### Solo las piezas se marcan a mano

Los únicos botones de estado están en la Vista 4, por pieza: **Finalizado** (la marca como cortada; se deshabilita si ya lo está) y **Pendiente** (deshace el corte; se deshabilita si está pendiente). El estado de módulos, pedidos y órdenes **no se toca a mano: se calcula solo** a partir de las piezas y se actualiza en todas las vistas:

- Con la primera pieza cortada, el módulo, el pedido y la orden pasan a "En producción" / "En proceso".
- Cuando **todas** las piezas de un módulo están cortadas, el módulo pasa a "Finalizado"; cuando todos los módulos de un pedido están finalizados, el pedido; y cuando todos los pedidos, la orden pasa a "Lista".
- Al deshacer una pieza, lo finalizado deja de estarlo; y si no queda ninguna pieza cortada, el módulo (y su pedido y su orden, si no tienen nada más avanzado) vuelven a "Pendiente".

Las piezas que nunca pasan por el escaneo de Rover (fondos, paneles sin etiqueta) se dan por cortadas con su botón "Finalizado", para poder cerrar el módulo.

### Vista 1 — Listado de órdenes (`/`)

La pantalla principal. Muestra una tabla con las órdenes de fabricación sincronizadas desde TeoWin que **no están archivadas**: número de orden, descripción, cantidad de pedidos y estado.

- **Buscador**: arriba de la tabla. Filtra mientras se escribe, por número de orden (el corto o el de fabricación), por **número de pedido** o por descripción; no distingue mayúsculas ni acentos. Si la orden apareció por un pedido, debajo de la descripción se ve cuál coincidió ("Pedido S1-00909"). Solo busca entre las órdenes de la vista actual (activas o archivadas). En la tablet, al tocar Enter el teclado se contrae (lo mismo en el buscador de los filtros de columna de la Vista 4).
- **Botón "Agregar orden"**: abre un formulario para escribir el número de orden de fabricación (el que aparece impreso en la etiqueta de corte, ej. `263.500.002` → se escribe `263500002`). Al confirmar, trae desde TeoWin todos los pedidos, módulos y piezas de esa orden. Si el número no existe en TeoWin, o ya estaba cargado, avisa con un mensaje claro.
- **Botón "Escanear"**: lleva a la Vista 5 (cámara).
- **Botón "Ver archivadas" / "Ver activas"**: alterna entre el listado principal y las órdenes archivadas (`/?archivadas=1`).
- **Por fila**:
  - **Archivar** / **Desarchivar**: oculta la orden del listado principal (o la trae de vuelta). No la elimina ni cambia su estado: sus piezas se siguen pudiendo escanear.
  - **Cesto** (ícono, sin texto): elimina la orden con un borrado lógico (pide escribir `confirmar`). La orden, sus pedidos, módulos y piezas quedan marcados como eliminados pero el historial se conserva; las etiquetas ya impresas dejan de ser válidas; TeoWin no se toca. Después se puede volver a agregar el mismo número.
- Click en el número de orden o en la descripción → entra a la Vista 2 de esa orden.

### Vista 2 — Pedidos de una orden (`/ordenes/:id`)

Los pedidos que forman parte de la orden seleccionada: número de pedido, cliente/referencia, cantidad de módulos y estado.

- Click en el número de pedido o en el cliente → entra a la Vista 3 de ese pedido.
- **Botón "Hojas de corte"** (arriba, junto al estado de la orden): lleva a la pantalla de hojas de corte de la orden (ver [Documentación digital](#documentación-digital-y-anotaciones)).
- Solo lectura: el estado de cada pedido se calcula a partir de sus módulos. Cuando **todos** los pedidos de una orden quedan finalizados, la orden pasa sola a "Lista".

### Vista 3 — Detalle de un pedido (`/pedidos/:id`)

Tres secciones, con una **barra fija arriba** para saltar entre ellas (**Modulación**, **Documentación**, **Planos**; cada botón muestra su cantidad, resalta la sección que estás viendo, y la Documentación lleva un punto ámbar si falta la Nota de Pedido o el Detalle de Remisión):

- **Modulación**: los módulos (muebles) del pedido: id, descripción, cantidad de tipos de pieza y estado. Click en el id o en la descripción → Vista 4 de ese módulo. Solo lectura: el estado de cada módulo se calcula a partir de sus piezas.
- **Documentación**: Nota de Pedido y Detalle de Remisión (obligatorios, se marca "Falta cargar" si no están) y documentación adicional (escandallo, herrajes, accesorios).
- **Planos**: los planos del pedido (no todos los pedidos los llevan).

Ver [Documentación digital](#documentación-digital-y-anotaciones).

### Vista 4 — Piezas de un módulo (`/modulos/:id`)

El detalle más fino: cada pieza física de ese módulo con **Código** (el de la etiqueta; "—" si la pieza no tiene etiqueta), **Familia**, **Artículo**, **Descripción**, **Color**, **Medidas** y **Estado** individual (Pendiente / Cortada).

- **Filtros estilo Excel** en Familia, Artículo, Descripción, Color, Medidas y Estado (no en Código ni en la acción). Cada ícono de embudo abre una lista de valores con checkbox y un buscador. Los filtros se **combinan** entre columnas y son **dinámicos**: las opciones de cada columna se recalculan según los otros filtros activos. Arriba de la tabla se ve el conteo ("10 de 40 piezas") y un botón para limpiar todo.
- **Finalizado / Pendiente** por pieza (la única acción de estado manual). "Finalizado" marca la pieza como cortada a mano: se usa para las piezas que **nunca pasan por el escaneo de Rover** (fondos, tapajuntas, paneles sin etiqueta) — es la única forma de darlas por resueltas.

### Vista 5 — Escaneo (`/escaneo`)

Pantalla completa pensada para tablet, con la cámara ocupando toda la pantalla ("modo continuo": no hay que tocar nada entre un escaneo y otro, la cámara queda siempre escuchando).

- **Mira**: un rectángulo con esquinas marcadas y una línea de barrido, con el resto de la imagen atenuada, para apuntar el código de barras. Es solo una guía visual: el lector busca el código en todo el cuadro.
- Apunta la cámara al código de barras de la etiqueta de corte (siempre 7 dígitos).
- Al reconocer un código válido, aparece abajo un cartel con el resumen (orden, pedido, pieza, medidas, color, código y el módulo con su id entre paréntesis):
  - **Verde** ("Pieza registrada"): la pieza era nueva. Pasa a "Cortada", y si era la primera de ese módulo/pedido/orden, todos suben de "Pendiente" a "En producción" (o "En proceso" en la orden).
  - **Amarillo** ("Pieza ya escaneada anteriormente"): la pieza ya estaba cortada; no cambia nada.
- Si el código no corresponde a ninguna pieza (o pertenece a una orden eliminada), aparece un cartel de error en vez del resumen — la cámara sigue funcionando, no hay que reiniciar nada.
- **Botón "Volver"** (esquina superior izquierda, siempre visible sobre la imagen de la cámara): vuelve a la Vista 1.

---

## Documentación digital y anotaciones

Permite consultar en la tablet, y **anotar**, los documentos que antes bajaban en papel.

### Dónde está cada cosa

| Qué | Dónde | Cómo se carga |
|---|---|---|
| **Hojas de corte** (PDF) | Vista 2, botón "Hojas de corte" (`/ordenes/:id/hojas-corte`) | "Cargar hoja de corte": nombre + PDF. Una orden puede tener varias (ej. MDP y MDF, cada una con su nombre) |
| **Nota de Pedido**, **Detalle de Remisión** (obligatorios) | Vista 3, sección Documentación | Botón "Subir" de cada tarjeta |
| **Escandallo de Placares**, **Herrajes de Producción** y **Accesorios de Instalación** (Placares o Cocinas) | Vista 3, "Documentación adicional" | Se elige el tipo (se autoselecciona al reconocer el título del PDF) y se sube. Herrajes y accesorios de Placares y de Cocinas son tipos distintos porque salen de reportes distintos |
| **Planos** (imagen JPG/PNG/WEBP o PDF) | Vista 3, sección Planos | Archivo + nombre + módulo (opcional) |

Se pueden cargar varios del mismo tipo (ej. una remisión parcial), con un nombre opcional. Eliminar pide confirmación y es un borrado lógico (se puede volver a cargar).

### Verificación al subir

Antes de subir un PDF de TeoWin, la app lee su primera hoja y **bloquea** la carga si:

- es de otra orden (hojas de corte: busca `Orden NNN`), o de otro pedido (documentos: busca el código `NN-NNNNN`), o
- parece ser de otro tipo que el elegido (por el título: "Nota de Pedido", "Detalle de Remisión", "Escandallo", "Herrajes…", "Accesorios…", y "Placares"/"Cocinas").

Si el PDF no tiene texto (un escaneo) no se puede verificar y se deja pasar. Los planos son imágenes: no se verifican.

### El visor

Se abre con **Abrir**. Muestra todas las hojas en una columna con scroll; solo dibuja las cercanas a la pantalla (una orden puede tener 80 hojas).

- **Arriba**: Volver, título, número de hoja (se puede escribir un número y Enter para saltar), zoom − / + (50 % a 300 %), "ajustar al ancho" y **Anotar**.
- Las anotaciones siempre se **ven**; solo se pueden crear tocando **Anotar** (así el operario no dibuja sin querer). **Listo** vuelve al modo lectura.
- **Herramientas** (modo Anotar): **Mover** (scroll y zoom con normalidad), **Lápiz**, **Resaltador** (translúcido), **Texto** (tocá un lugar, escribí y Enter), **Borrar** (tocá una anotación para quitarla) y **Deshacer** (quita lo último que anotó *este* dispositivo). Cuatro colores y tres grosores. Con Lápiz o Resaltador el dedo **dibuja** (no scrollea): para moverte, pasá a "Mover".
- **Notas del documento**: en modo Anotar se pueden agregar notas que valen para todo el documento (ej. "Págs. 77 a 80: MDF, bajan aparte"). Se muestran **siempre**, en una franja amarilla arriba.
- **Varias tablets**: las anotaciones se guardan en el servidor al instante y cada visor abierto se refresca cada 20 segundos.
- El archivo original **nunca se modifica**: las anotaciones se dibujan encima. Se guardan con coordenadas relativas al tamaño de la página (se ven igual con cualquier zoom o dispositivo).
- **Permisos**: el botón **Anotar** solo aparece con el permiso `documentacion.anotar` (admin, tecnica y fabrica); **Borrar** y **Deshacer** y el borrado de notas, solo con `documentacion.anotaciones.eliminar` (admin y tecnica). Subir y eliminar documentos requiere `documentacion.gestionar`. Gerencia solo ve. No se registra quién anotó.

### Para quien programa

- `modules/hoja-corte/components/hoja-corte-visor.tsx` es **el visor de todos los documentos** (a pesar del nombre): recibe `src`, `anotacionesUrl`, `tipoArchivo` (`"pdf"` por defecto, `"imagen"` para planos) y los permisos `puedeAnotar` / `puedeEliminarAnotaciones` (ambos `false` por defecto: sin ellos el visor es de solo lectura). Cada página que lo usa los calcula con `puede(sesion, PERMISOS.…)`.
- Las anotaciones usan `hooks/use-anotaciones.ts` (altas y bajas optimistas con reversión, refresco periódico) y se dibujan en una capa SVG por página (`anotaciones-capa.tsx`).
- Para sumar otro tipo de documento: tabla + rutas en el backend, route handlers proxy, y reutilizar el visor pasándole su `anotacionesUrl`.

---

## Diseño visual

- **Tema claro** (fondo blanco, letra oscura). La paleta sale de la propuesta *"Propuesta Digitalizacion Fabrica Neostone.pdf"*: negro carbón `#1A1A1A` (botones, encabezados), bronce `#9C7A4C` (acento: estado "En producción/En proceso", línea de la mira, animación de carga), beige cálido `#F4F2EF` y tonos cercanos (filas alternadas, hover), grises cálidos para bordes y texto secundario.
- **Estados**: *Pendiente* = etiqueta outline con fondo blanco; *En producción / En proceso* = bronce; *Finalizado / Cortada / Lista* = verde con ícono de check.
- **Filas de tabla** alternan blanco y beige para dar contraste; el hover es un beige más oscuro.
- **Tamaño de letra**: la base es 17,5 px (un poco más que el default de 16 px); todo Tailwind escala con eso.
- **Carga**: tres puntos que crecen y se achican en sucesión (`LoadingDots`) — en la pantalla de carga de cada página (`app/loading.tsx`) y dentro de los botones mientras corre una acción.
- **Tipografía**: Geist (variable `--font-geist-sans`).

Los tokens de color están en [`app/globals.css`](app/globals.css) (variables `--primary`, `--background`, `--gold`, etc.). El bloque `.dark` sigue definido pero la app no lo usa.

---

## Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| La página carga pero la lista de órdenes tira error, o no carga nada | El backend no está corriendo, o `API_URL` en `.env.local` no apunta a donde está | Confirmá que `npm run dev` del backend esté corriendo y que responda en `http://localhost:4000/api/health` |
| Desde la tablet, la cámara no se activa nunca (mensaje "requiere HTTPS") | Estás entrando por HTTP directo al puerto 3000 (`http://192.168.x.x:3000`) en vez de por Caddy | Entrá por `https://<IP>/` (sin `:3000`, con `https://`) — ver [Cámara y HTTPS](#cámara-y-https--por-qué-hace-falta-caddy) |
| La cámara se activa un segundo y se corta | Es un efecto de "Strict Mode" de React en modo desarrollo (monta y desmonta el componente dos veces para detectar fugas) — ya está resuelto en el código actual con un pequeño retraso al pedir la cámara, pero si volvés a ver esto después de tocar `escaner-camara.tsx`, es la primera sospecha | Revisar `modules/pieza/components/escaner-camara.tsx` |
| Agregar una orden o escanear una pieza no hace nada, sin error visible | La IP de la PC cambió y `next.config.ts` todavía tiene la vieja (bloqueo silencioso de seguridad de Next.js) | Seguir el paso a paso de la sección **"La IP de esta PC cambió: paso a paso"** (en resumen: actualizar `allowedDevOrigins` en `next.config.ts` y el `Caddyfile` con la IP actual, y reiniciar `npm run dev`) |
| El certificado de HTTPS no es de confianza | Es autofirmado, a propósito (no hace falta pagar/gestionar un certificado público para una red interna) | Aceptar el aviso del navegador una vez por dispositivo |
| El visor muestra solo tres puntos y no abre la hoja | El PDF no llegó o el navegador es muy viejo para pdf.js | Recargar; si el aviso dice "No se pudo abrir la hoja de corte", revisar que el backend esté corriendo. En desarrollo (`npm run dev`), la **primera** carga del visor tarda porque compila pdf.js; en producción abre en menos de un segundo |
| Subir un PDF falla con "Este PDF es del pedido X…" / "parece ser …" | Se está cargando en el pedido o tipo equivocado (es la verificación funcionando) | Subirlo donde corresponde, o elegir el tipo correcto |
| La app siempre vuelve a la pantalla de PIN | La sesión venció (12 h), el usuario fue dado de baja, se cambió `SESSION_SECRET` en el backend, o el navegador bloquea cookies | Volver a ingresar el PIN; si se repite, verificar que el usuario esté `activo` en la base y que el backend esté corriendo |
| "PIN incorrecto" con un PIN que debería andar | El `pin_hash` se generó con otro `PIN_PEPPER` o hay otro backend con distinta configuración | Regenerar el hash con `npm run usuario:sql` en el backend actual (ver su README) |
| Un botón no aparece o la app responde "No tenés permiso" | El rol del usuario no incluye ese permiso (es lo esperado) | Revisar la tabla de roles de [Ingreso con PIN y roles](#ingreso-con-pin-y-roles); los permisos se editan en la tabla `rol_permiso` del backend |
| Una anotación hecha en otra tablet no aparece | El visor se refresca cada 20 segundos | Esperar unos segundos o recargar la página |
| Una tabla se corta a la derecha (scroll horizontal) en una pantalla angosta | Con la letra más grande, la tabla de piezas (9 columnas) necesita más de ~800 px | Es esperado en pantallas chicas; en desktop/tablet horizontal entra. Las páginas usan `max-w-6xl` |
