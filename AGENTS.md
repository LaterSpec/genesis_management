# AGENTS.md — GenesisGym Management

Reglas de desarrollo para humanos y agentes de IA. Objetivo: mantener un monolito Next.js predecible, sin deuda técnica por capas mezcladas o pantallas inconsistentes.

<!-- BEGIN:nextjs-agent-rules -->
## Next.js 16

This is NOT the Next.js you know. APIs, conventions, and file structure may differ from your training data. **Before writing or changing Next.js code**, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices. Session middleware lives in [`src/proxy.ts`](src/proxy.ts) (not necessarily `middleware.ts` at root).
<!-- END:nextjs-agent-rules -->

---

## Producto

- **GenesisGym Management**: operación de gimnasio (recepción + administración).
- **UI**: español (locale `es-MX` en fechas/moneda).
- **Moneda**: soles peruanos — prefijo **S/** en pantallas.
- **Iconos**: Material Symbols Outlined (`material-symbols-outlined`).
- **Roles**: `administrator` | `receptionist` (enum `role_enum` en `profiles`).

---

## Arquitectura

**Monolito modular full-stack** (Next.js App Router + Supabase). No hay microservicios ni capa Repository abstracta.

| Etiqueta | En este repo |
|----------|----------------|
| Monolito modular | Una app; features en `src/app/pages/{feature}/` |
| App Router + RSC | Datos iniciales en `async` Server Components |
| BFF ligero | Server Actions + `lib/api` delante de Postgres |
| Colocación por feature | `page`, Manager, `actions` en la misma carpeta |

### Flujo de una pantalla (patrón canónico)

Referencias: `sales`, `clients`, `staff`, `memberships`.

```
page.tsx (Server)  →  lib/api/*.ts  →  Supabase
       ↓ props
*Manager.tsx (Client)  →  actions.ts (Server)  →  lib/api  →  revalidatePath + logAction
```

### Límites de capas

| Ubicación | Responsabilidad | Prohibido |
|-----------|-----------------|-----------|
| `src/app/pages/{f}/page.tsx` | Fetch en servidor, auth/redirect de ruta, pasar props | Estado UI, formularios, mutaciones directas |
| `src/app/pages/{f}/*Manager.tsx` | Estado, eventos, modales, llamar Server Actions | Queries/mutaciones Supabase, reglas de negocio multi-tabla |
| `src/app/pages/{f}/actions.ts` | Auth, validación entrada, orquestar API, revalidar, log | SQL inline, UI, imports desde `"use client"` |
| `src/lib/api/*.api.ts` | Lectura/escritura Supabase, transacciones de dominio | React, cookies de sesión (salvo necesidad documentada) |
| `src/lib/database.types.ts` | Tipos alineados al esquema | Lógica de negocio |
| `src/components/layout/` | Shell, navegación, caja, tema | Lógica de dominio de un módulo |

**Regla crítica:** `src/lib/api/**` solo se importa desde Server Components, Server Actions o otros módulos de servidor. Los Client Components mutan datos **únicamente** vía `actions.ts`.

---

## Scaffold: página nueva (CRUD o formularios)

Usar este layout. No inventar variantes salvo vista de solo lectura muy simple (ver excepciones).

```
src/app/pages/{feature}/
  page.tsx                 # export default async function …Page()
  {Feature}Manager.tsx     # "use client"
  actions.ts               # "use server"
```

### Checklist obligatorio

1. **Ruta** en [`src/components/layout/Sidebar.tsx`](src/components/layout/Sidebar.tsx):
   - Todos los roles → `baseNavItems`
   - Solo admin → añadir condicional `isAdmin` (como Personal → `/pages/staff`)

2. **`page.tsx`**
   - Server Component `async`
   - Cargar con `Promise.all([...])` desde `lib/api`
   - Pasar datos iniciales al Manager (`initialX`, `stats`, etc.)
   - Si es **solo admin**: copiar patrón de [`staff/page.tsx`](src/app/pages/staff/page.tsx):
     - `createClient` de `@/utils/supabase/server`
     - `getUser()` → `redirect("/login")` si no hay sesión
     - Verificar `profiles.role === "administrator"` → si no, `redirect("/pages/dashboard")`
     - `export const dynamic = "force-dynamic"` cuando la lista dependa de auth

3. **`{Feature}Manager.tsx`**
   - Primera línea: `"use client"`
   - Props tipadas; sin fetch de datos sensibles en `useEffect` si puede hacerse en servidor
   - Llamar acciones importadas desde `./actions`
   - Estados de carga en botones (`disabled`, spinner)

4. **`actions.ts`**
   - Primera línea: `"use server"`
   - Supabase de sesión: `@/utils/supabase/server` (`createClient`), **no** `@/lib/supabase/client`
   - Constante `PATHS` / `PATHS_TO_REVALIDATE` con todas las rutas cuyo RSC debe refrescarse
   - Tras mutación exitosa: `revalidatePath` para cada path + `logAction` cuando aplique
   - Respuestas tipadas: `{ success: boolean; data?: T; error?: string }`

5. **Datos**
   - Tipos compartidos en [`src/lib/database.types.ts`](src/lib/database.types.ts)
   - Queries en `src/lib/api/{domain}.api.ts` (nuevo archivo o extender dominio existente)
   - Cambio de esquema → migración SQL + actualizar [`docs/erd.md`](docs/erd.md) + regenerar tipos

6. **UI**
   - Tokens de [`src/app/globals.css`](src/app/globals.css): `bg-surface`, `text-on-surface`, `text-primary`, `font-headline`, `font-body`, `border-outline-variant`, etc.
   - No introducir colores hex arbitrarios; usar variables del tema
   - Encabezados de página: label pequeño + `h2` con `font-headline`

### Excepciones (no replicar en features nuevas)

- `credits/page.tsx` y `activity_log/page.tsx`: UI inline sin Manager — solo para listados estáticos simples.
- Preferir siempre Manager + `actions` si habrá crear/editar/eliminar.

---

## Server Actions

```typescript
"use server";

import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/api/logs.api";

const PATHS_TO_REVALIDATE = ["/pages/{feature}", "/pages/dashboard"];

function revalidateAll() {
  PATHS_TO_REVALIDATE.forEach((path) => revalidatePath(path));
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### Admin

Extraer helper reutilizable (ver `staff/actions.ts`):

```typescript
async function checkAdminAuthorization() {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado en el sistema.");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "administrator") {
    throw new Error("No autorizado. Se requieren privilegios de administrador.");
  }
  return user;
}
```

Invocar al inicio de cada action sensible en features de administración.

### Bitácora

Tras operaciones relevantes, registrar con `logAction` desde [`src/lib/api/logs.api.ts`](src/lib/api/logs.api.ts):

- `action_type`: constante descriptiva (`SALE_CREATED`, `STAFF_CREATED`, …)
- `description`: texto legible en español
- `user_id` / `client_id` cuando existan

---

## Capa `lib/api`

### Estilo de archivo

```typescript
/**
 * {domain}.api.ts
 * ─────────────────────────────────────────────────────────────
 * Dominio: {descripción breve}.
 */

import { supabase } from "@/lib/supabase/client";
import type { … } from "@/lib/database.types";
```

### Errores

```typescript
if (error) throw new Error(`[sales.api] getSalesHistory: ${error.message}`);
```

Prefijo `[nombreArchivo.api] nombreFunción` en todos los throws.

### Operaciones compuestas

Mantener en **una** función de dominio (ej. `createSale`: venta + ítems + stock + membresía + transacción financiera + sesión de caja). No repartir pasos entre varias Server Actions.

### Mapa de módulos API

| Archivo | Dominio |
|---------|---------|
| `clients.api.ts` | Clientes, planes, membresías, créditos, visitante POS |
| `inventory.api.ts` | Productos, categorías, stock |
| `sales.api.ts` | Ventas, carrito, historial |
| `finances.api.ts` | Transacciones financieras |
| `attendance.api.ts` | Asistencias |
| `cash-sessions.api.ts` | Turnos de caja |
| `users.api.ts` | Personal (requiere `SUPABASE_SERVICE_ROLE_KEY` en servidor) |
| `logs.api.ts` | `activity_logs` |

---

## Supabase: dos clientes (no crear un tercero)

| Cliente | Ruta | Cuándo usar |
|---------|------|-------------|
| Singleton anon | `@/lib/supabase/client` | **`lib/api/*`** — lecturas/escrituras de dominio |
| SSR con cookies | `@/utils/supabase/server` | **Server Actions**, `page.tsx` con auth |
| Browser | `@/utils/supabase/client` | Cliente ligero (ej. Sidebar rol); minimizar |
| Middleware | `@/utils/supabase/middleware` | Sesión en [`src/proxy.ts`](src/proxy.ts) |

Variables: ver [`.env.example`](.env.example). `SUPABASE_SERVICE_ROLE_KEY` solo en servidor (`users.api.ts`).

### Esquema y tipos

- Migraciones: `supabase/migrations/` con prefijo numérico ordenado.
- IDs mixtos: **UUID** (`profiles.id` → `auth.users`), **BIGSERIAL** (`clients`, `sales`, `products`, …). No asumir un solo tipo.
- Regenerar tipos tras migrar:

```bash
npx supabase gen types typescript --local > src/lib/database.types.ts
```

---

## Auth, sesión y caja

- Rutas protegidas: middleware refresca sesión (`src/proxy.ts`).
- **Recepcionista**: [`CashSessionContext`](src/components/layout/CashSessionContext.tsx) + overlay en [`AppLayout`](src/components/layout/AppLayout.tsx) hasta abrir caja.
- **Ventas**: asociar `cash_session_id` cuando existe sesión abierta del `seller_id` (`sales.api.ts`).
- **Administrador**: sin bloqueo de caja; acceso a `/pages/staff`.
- Validar rol en **servidor** para rutas admin; no confiar solo en ocultar el enlace del Sidebar.

---

## UI y diseño

- Tipografía: `font-headline` (Manrope) títulos; `font-body` (Inter) cuerpo.
- Botones primarios: `bg-gradient-cta`, sombras `shadow-primary/20`.
- Modales: overlay `bg-black/60 backdrop-blur-sm`, contenedor `bg-surface-container-low`, `rounded-2xl` o `rounded-3xl`.
- Formularios: labels `text-xs font-bold uppercase tracking-wider`, inputs `bg-surface-container-low border border-outline-variant/30`.
- Tema claro/oscuro: `ThemeProvider` + clase `dark` en `<html>`; respetar tokens, no hardcodear blanco/negro puro.

---

## Anti-patrones (evitar deuda técnica)

| No hacer | Hacer en su lugar |
|----------|-------------------|
| Supabase writes desde `"use client"` | Server Action → `lib/api` |
| Importar `lib/api` en Managers | Pasar datos por props; mutar vía actions |
| Lógica multi-tabla en `actions.ts` o Manager | Función en `*.api.ts` |
| Página CRUD sin `actions.ts` | Scaffold completo de tres archivos |
| Olvidar `revalidatePath` | Array `PATHS_TO_REVALIDATE` centralizado |
| Cambiar DB sin migración + ERD | `supabase/migrations` + `docs/erd.md` |
| Nuevo hex color en componentes | Tokens `@theme` en `globals.css` |
| Tercer cliente Supabase | Usar tabla de clientes arriba |
| Copiar plantilla genérica de Next en README | Mantener README/AGENTS del proyecto |
| Páginas admin sin guard en `page.tsx` | Patrón `staff/page.tsx` |

---

## Referencias rápidas

### Rutas de aplicación

Prefijo URL: `/pages/...` (carpeta física `src/app/pages/...`).

| Módulo | Carpeta |
|--------|---------|
| dashboard | `src/app/pages/dashboard/` |
| clients | `src/app/pages/clients/` |
| attendances | `src/app/pages/attendances/` |
| inventory | `src/app/pages/inventory/` |
| memberships | `src/app/pages/memberships/` |
| sales | `src/app/pages/sales/` |
| finances | `src/app/pages/finances/` |
| credits | `src/app/pages/credits/` |
| activity_log | `src/app/pages/activity_log/` |
| staff (admin) | `src/app/pages/staff/` |

### Alias de imports

`@/*` → `src/*` ([`tsconfig.json`](tsconfig.json)).

### Documentación humana

- [README.md](README.md) — setup y overview
- [docs/erd.md](docs/erd.md) — modelo de datos
