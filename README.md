# GenesisGym Management

Sistema web interno para la operación diaria de **GenesisGym**: recepción (POS, clientes, asistencias, caja) y administración (finanzas, inventario, personal). Construido como monolito full-stack con **Next.js** y **Supabase** (PostgreSQL + Auth).

## Módulos

| Ruta | Módulo | Descripción | Acceso |
|------|--------|-------------|--------|
| `/pages/dashboard` | Dashboard | Resumen operativo y métricas | Todos |
| `/pages/clients` | Clientes | Alta, edición y consulta de socios | Todos |
| `/pages/attendances` | Asistencias | Registro de entrada al gimnasio | Todos |
| `/pages/inventory` | Inventario | Productos, categorías y stock | Todos |
| `/pages/memberships` | Membresías | Planes y membresías activas | Todos |
| `/pages/sales` | Ventas (POS) | Punto de venta: productos y planes | Todos |
| `/pages/finances` | Finanzas | Ingresos, egresos y movimientos | Todos |
| `/pages/credits` | Créditos | Cartera de deudas de clientes | Todos |
| `/pages/activity_log` | Registro | Bitácora de acciones del sistema | Todos |
| `/pages/staff` | Personal | Usuarios internos (auth + perfiles) | Solo `administrator` |
| `/login` | Autenticación | Inicio y cierre de sesión | Público (sin layout) |

La raíz (`/`) redirige a `/pages/dashboard`.

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Backend / DB | [Supabase](https://supabase.com) — PostgreSQL, Auth, RLS |
| Tipado | TypeScript 5 |
| Fuentes / iconos | Inter, Manrope, Material Symbols Outlined |

## Arquitectura (resumen)

El proyecto es un **monolito modular por dominio**: cada feature vive bajo `src/app/pages/{feature}/` con capas claras:

1. **`page.tsx`** — Server Component: carga datos vía `src/lib/api/*.api.ts` y pasa props al Manager.
2. **`{Feature}Manager.tsx`** — Client Component: UI interactiva; mutaciones solo vía Server Actions.
3. **`actions.ts`** — Server Actions: auth, orquestación, `revalidatePath`, bitácora (`logAction`).
4. **`src/lib/api/`** — Acceso a datos Supabase por dominio (sin lógica de UI).

Auth y cookies SSR usan `src/utils/supabase/`; las APIs de dominio usan el singleton en `src/lib/supabase/client.ts`.

```
Browser → AppLayout / CashSessionContext
       → page.tsx (RSC) → lib/api
       → *Manager.tsx → actions.ts → lib/api → Supabase
```

Convenciones detalladas, scaffold de páginas nuevas y anti-patrones: **[AGENTS.md](./AGENTS.md)**.

## Estructura del repositorio

```
genesis_management/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout global, providers
│   │   ├── login/              # Auth
│   │   └── pages/              # Módulos de negocio
│   ├── components/layout/      # Sidebar, TopAppBar, caja
│   ├── lib/
│   │   ├── api/                # Capa de datos por dominio
│   │   ├── database.types.ts   # Tipos del esquema
│   │   └── supabase/client.ts  # Cliente para lib/api
│   ├── utils/supabase/         # Cliente SSR (server, client, middleware)
│   └── proxy.ts                # Middleware de sesión (Next 16)
├── supabase/
│   ├── migrations/             # Esquema SQL versionado
│   └── seed.sql                # Datos de desarrollo
├── docs/
│   ├── erd.md                  # Diagrama entidad-relación
│   └── dbdiagram.dbml
├── AGENTS.md                   # Reglas para desarrollo y agentes IA
└── README.md
```

## Requisitos previos

- **Node.js** 20 o superior
- **npm** (o pnpm/yarn)
- Proyecto **Supabase** (cloud o local con [Supabase CLI](https://supabase.com/docs/guides/cli))
- Opcional: Supabase CLI para `supabase start`, migraciones y seed local

## Configuración

1. Clonar el repositorio e instalar dependencias:

```bash
npm install
```

2. Copiar variables de entorno:

```bash
cp .env.example .env.local
```

3. Completar `.env.local` con las credenciales de tu proyecto Supabase (Settings → API):

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (cliente y SSR) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor; gestión de personal (`users.api`) |

> La service role **no** debe exponerse al navegador. Solo se usa en Server Actions / APIs de servidor.

## Desarrollo local

### Solo frontend (Supabase remoto)

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### Supabase local (opcional)

```bash
supabase start
supabase db reset   # aplica migraciones + seed.sql
npm run dev
```

Usuarios de prueba en `supabase/seed.sql`:

| Email | Contraseña | Rol |
|-------|------------|-----|
| `admin@genesisgym.com` | `admin123` | `administrator` |
| `reception@genesisgym.com` | `admin123` | `receptionist` |

### Scripts npm

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |

## Roles y reglas de negocio

| Rol | Comportamiento |
|-----|----------------|
| **receptionist** | Debe **abrir caja** al iniciar turno (overlay en `AppLayout`). Las ventas se vinculan a la sesión de caja activa. Al cerrar sesión con caja abierta, se solicita cerrar el turno primero. |
| **administrator** | No requiere apertura de caja. Acceso a **Personal** (`/pages/staff`). |

Perfiles en tabla `profiles` (extiende `auth.users`). Detalle del modelo: [docs/erd.md](./docs/erd.md).

## Base de datos

- Migraciones: `supabase/migrations/` (orden numérico: `1_initial_schema.sql`, `2_cash_sessions.sql`, …).
- Tras cambiar el esquema, actualizar tipos TypeScript:

```bash
npx supabase gen types typescript --local > src/lib/database.types.ts
```

- Mantener alineados `docs/erd.md` y las migraciones.

## Documentación adicional

- [docs/erd.md](./docs/erd.md) — Diagrama entidad-relación (Mermaid)
- [docs/dbdiagram.dbml](./docs/dbdiagram.dbml) — Fuente para dbdiagram.io
- [AGENTS.md](./AGENTS.md) — Convenciones de código, scaffold de páginas y reglas para evitar deuda técnica

## Contribución

Antes de añadir rutas, APIs o pantallas nuevas, leer **[AGENTS.md](./AGENTS.md)**. Ahí está el patrón obligatorio `page.tsx` + `*Manager.tsx` + `actions.ts`, uso de Supabase por capa y lista de anti-patrones del proyecto.

Para cambios en Next.js 16, consultar también la guía en `node_modules/next/dist/docs/` (APIs y convenciones pueden diferir de versiones anteriores).
