# Arquitectura — alfabetica-panel-webapp

Frontend del panel administrativo de Alfabética. Next.js 16 (App Router), TypeScript estricto, Tailwind v4, shadcn/ui (Radix), TanStack Query, React Hook Form + Zod.

## Principios

- **Código y archivos en inglés; UI y rutas en español** (`/proyectos`, `/portafolio`, `/tienda`, `/produccion`, `/colaboradores`).
- **Un solo contrato**: `src/contracts/*` replica los DTO del panel-api. Lo usan las features (cliente) y el servidor simulado. Lo marcado `@api proposed` no existe aún en el API (ver `docs/API_NOTES.md`).
- **Un solo camino de datos**: el navegador solo llama a `/api/*` (BFF en `src/app/api/[...path]`). El BFF decide por módulo si responde el **mock** (`src/server/mock`) o reenvía al **panel-api real** (`API_MODE_<MODULE>`). Las pantallas no saben cuál es.
- **Sin duplicar**: rutas en `core/http/endpoints.ts`; clientes HTTP por feature en `features/<f>/api/*-api.ts`; componentes comunes en `shared/`.

## Estructura

```
src/
  app/                      Rutas (delgadas: solo montan la vista de la feature)
    (auth)/login            Login
    (panel)/*               Módulos protegidos (PanelShell restaura la sesión)
    api/[...path]/route.ts  BFF
  proxy.ts                  Guard optimista de rutas (cookie refreshToken)
  config/                   env.client.ts (NEXT_PUBLIC_*), env.server.ts (server-only), navigation.ts
  contracts/                Tipos de request/response del panel-api
  core/
    auth/                   SessionProvider, token en memoria, permisos, IdentityProvider (mock | firebase)
    http/                   http-client (Bearer + refresh single-flight), endpoints, ApiError
    media/                  prepareImage (WebP en navegador) + runUploadFlow (create → PUT → confirm)
    query/                  QueryClient
  features/<module>/
    api/                    <module>-api.ts (funciones HTTP) + query keys
    hooks/                  useQuery / useMutation (invalidaciones + notificaciones)
    schemas/                Esquemas Zod de formularios (espejo de class-validator del API)
    lib/                    Lógica pura (filtros, orden, mapeos)
    components/             <module>-view.tsx (orquesta la pantalla) + piezas
  server/
    bff/                    handle.ts, forward.ts, module-resolver.ts (allow-list)
    mock/                   router, db en memoria, seed, guards (AccessToken/Permissions), handlers por módulo
  shared/
    ui/                     Primitivas shadcn (button, input, modal, select, badge…)
    components/             layout/, data/ (SpineCard, FilterChips, Pagination, SearchInput), feedback/, form/
    hooks/ lib/
```

## Patrón de un módulo (referencia: `features/projects`)

1. `components/<module>-view.tsx` es el único componente que conoce el estado de la pantalla (búsqueda, filtros, modales abiertos). Se monta desde `app/(panel)/<ruta>/page.tsx` dentro de `<Suspense>` si usa `useSearchParams`.
2. Toolbar: `SearchInput` + `FilterChips` + acción primaria (`Button`, en móvil FAB fijo sobre la barra inferior).
3. Lista: `SpineCard` + `SpineCardHeader` + filas responsivas (grid en `md:`, tarjeta apilada en móvil) + `Pagination` (`usePagination`, paginación del lado del cliente).
4. Estados: skeleton (`isPending`), `ErrorState` (con reintento), `EmptyState` (vacío y sin resultados), `ReadOnlyBanner` cuando falta el permiso de escritura (`usePermission`).
5. Modales: `Modal` + `ModalContent` (centrado o `placement="side"`; en móvil siempre hoja inferior). Formularios con RHF + Zod y `Field`.
6. Destructivos: `ConfirmDialog` (checkbox o palabra clave). Si el API permite deshacer conceptualmente, usar `useDeferredAction` + `notify.removed(..., undo)`.
7. Avisos: `notify.success | removed | info | error`.
8. Subtítulo del masthead: `usePageSubtitle("…")`.
9. Color del módulo: `--module` / `--module-strong` (definidos en `config/navigation.ts`), clases `bg-module`, `text-module-strong`, `Button` por defecto ya lo usa.

## Autenticación (simulada, contrato real)

1. `IdentityProvider.signIn()` → ID token (mock hoy; Firebase en `core/auth/identity/firebase-identity-provider.ts`).
2. `POST /api/auth/login` con `Authorization: Bearer <idToken>` → `{ accessToken }` + cookie `refreshToken` (httpOnly, SameSite=Lax, Secure en producción).
3. Access token **solo en memoria** (`token-store.ts`). Al recargar: `POST /api/auth/refresh`.
4. 401 en cualquier llamada → un único refresh compartido → reintento; si falla → `/login?expired=1`.
5. `GET /api/users/me` → permisos (`users, projects, portfolio, production, publication, settings`).

## Seguridad

- BFF con allow-list de rutas (404 para lo demás) y verificación de `Origin` en métodos que escriben.
- Solo se reenvían al API los headers necesarios y la cookie `refreshToken`.
- `PANEL_API_URL` nunca llega al navegador. Variables públicas solo con prefijo `NEXT_PUBLIC_`.
- Redirección post-login validada (`safeNext`) para evitar open redirects.
- Headers de seguridad en `next.config.ts` (frame DENY, nosniff, HSTS, referrer, permissions).
