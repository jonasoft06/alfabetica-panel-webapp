---
tipo: anotaciones
proyecto: alfabetica-panel-api
origen: alfabetica-panel-webapp
---

# Anotaciones para panel-api (desde panel-webapp)

> El panel-webapp **no modificó** el panel-api. Esta nota reúne lo que el front necesita o detectó, para revisarlo y decidir. Cada punto indica prioridad: 🔴 bloquea pasar un módulo a `real` · 🟡 recomendado · 🟢 opcional.

## 1. Infraestructura y seguridad

| # | Punto | Prioridad | Detalle |
|---|---|---|---|
| 1.1 | **CORS no configurado** | 🟢 | `main.ts` no llama `enableCors`. El panel no lo necesita porque llama al API a través de su BFF (mismo origen). Solo hará falta si otro front (p. ej. `alfabetica-webapp`) llama directo desde el navegador. |
| 1.2 | **Dominio de la cookie** | 🟡 | La cookie `refreshToken` no define `domain`/`path`; vía BFF queda en el dominio del panel (correcto). Mantenerlo así. En producción se envía con `secure`. |
| 1.3 | **Rate limit en `/auth/login` y `/auth/refresh`** | 🟡 | No hay throttling. Sugerencia: `@nestjs/throttler` (p. ej. 10 req/min por IP en auth). El BFF ya reenvía `x-forwarded-for`; activar `app.set('trust proxy', 1)` detrás de Dokku/Cloudflare. |
| 1.4 | **Headers de seguridad** | 🟢 | Sugerencia: `helmet()` en `main.ts`. |
| 1.5 | **Rotación de refresh token** | 🟢 | Hoy no rota (decisión documentada). Revisar a futuro: rotar en cada `/auth/refresh` y revocar el anterior. |
| 1.6 | **Break-glass superadmin** | 🟡 | Sigue sin implementarse (`SUPERADMIN_FIREBASE_UID` solo validado). `POST /media/cleanup-pending` usa `settings` temporalmente. |
| 1.7 | **Seed de `SiteSettings`** | 🔴 (prod) | Pendiente antes del deploy; el panel lee `portfolioMaxItems` en Portafolio y Resumen. |
| 1.8 | **CORS de Spaces** | 🔴 (subidas) | El navegador hace `PUT` directo a la URL prefirmada con `Content-Type`. El bucket debe permitir `PUT` desde el dominio del panel (y `localhost:3000` en desarrollo) con header `Content-Type`. |
| 1.9 | **CLAUDE.md desactualizado** | 🟢 | Habla de `role_permissions` y de `alfabetica-panel-web`; el schema real usa `user_permissions` (permisos por usuario) y el repo se llama `alfabetica-panel-webapp`. |

## 2. Endpoints existentes — ajustes de forma

| # | Endpoint | Prioridad | Qué falta |
|---|---|---|---|
| 2.1 | `GET /projects` (`ProjectListItemDto`) | 🟡 | El listado de la maqueta muestra **subtítulo**, **descripción** y **actualizado**. Agregar `subtitle`, `description`, `updatedAt`. El front ya los trata como opcionales (sin ellos muestra menos información y ordena por `createdAt`). |
| 2.2 | `GET /projects` | 🟢 | Sin búsqueda ni paginación: el front filtra y pagina en cliente (suficiente para el tamaño del catálogo). Si crece: `?q=&page=&pageSize=` con `{ items, total }`. |
| 2.3 | `CreateProjectDto` | 🟢 | No admite `production`; el front crea el proyecto y luego llama `POST /projects/:id/production` (propuesto). Alternativa: agregar `production?: {}` al DTO como `portfolio`. |
| 2.4 | `PATCH /projects/:id` | 🟢 | El front envía `null` para limpiar campos opcionales (`subtitle`, `description`, `client`, `issueYear`). Confirmar que `UpdateProjectDto` (con `@IsOptional`) lo persiste como `null`. |

| 2.5 | `PUT /projects/:id/publication` | 🟡 | Limpiar un campo de texto opcional (formato, ISBN, colección…) o `compareAtPrice`: `PublicationFieldsDto` no admite `null`. El front envía `""`; definir si el API lo normaliza a `null` o si se acepta `null` explícito. |
| 2.6 | `DELETE /media/:id` sobre una portada | 🟡 | El front quita la portada borrando su media. Confirmar que el API desvincula `coverMediaId` (el mock lo hace) o exponer un endpoint para quitar portada. |
| 2.7 | `PUT /projects/:id/portfolio` | 🟢 | El mock responde 404 si el proyecto no tiene portafolio y conserva `displayOrder` al despublicar; validar que el API haga lo mismo. |
| 2.8 | Reordenar portafolio | 🟢 | Guardar el orden hace un `PUT displayOrder` por cada título que cambió. Si se vuelve lento: `PUT /portfolios/order { projectIds }`. |

## 3. Endpoints propuestos (el front ya los consume vía mock)

Contratos exactos en `src/contracts/*` (marcados `@api proposed`). Mock de referencia en `src/server/mock/handlers/*`.

### Media
- `GET /projects/:id/media?scope=PORTFOLIO|PUBLICATION` → `{ scope, cover, gallery[] }` — ya diseñado en *Ruta siguiente bloque*, paso 1. 🔴 para Portafolio y Tienda en `real`.

### Portafolio
- `GET /portfolios` → `{ items: PortfolioListItem[], counts{ total, published, unpublished, withoutCover }, maxItems }`. 🔴

### Tienda
- `GET /publications` → `{ items: PublicationListItem[], counts{ total, published, byType } }`. 🔴

### Producción (módulo 8)
- `POST /projects/:id/production` · `DELETE /projects/:id/production` (permiso `projects`, como las otras facetas). El `publicCode` se autogenera (`ALF-<iniciales>-<año>`).
- `GET /productions`, `GET /production-stages`, `GET|PUT /projects/:id/production`, `POST /productions/sync` (permiso `production`).
- `PUT` valida: `publicCode` único (sin distinguir mayúsculas) y no vacío, `clickupListId` alfanumérico de 5 a 20, fechas `yyyy-mm-dd`, `estimatedTotalDays` entero positivo, `currentStageId` existente; al cambiar `clickupListId` pone `lastSyncedAt = null`.
- `POST /productions/sync` responde `200 { syncedAt, updated }` → usar `@HttpCode(200)` en Nest.
- `estimatedEndDate` hoy lo calcula el front (inicio + días); podría calcularlo el API.

### Colaboradores
- `GET /users`, `POST /users/invitations`, `PUT /users/:id/permissions`, `PATCH /users/:id/status`, `GET /roles`, `GET /permissions`.
- `POST /users/:id/invitation/resend` (renueva expiración; 409 si no está INVITED). Invitación: 400 si el dominio no es `alfabetica.com.mx`, 409 si el correo existe, vence a 7 días.
- Lectura (`GET /users`, `/roles`, `/permissions`) abierta a cualquier sesión para mostrar la vista de solo lectura; si el API exige `users` también para leer, la pantalla mostrará el estado de error.
- Al cambiar los propios permisos, el access token conserva los anteriores hasta el siguiente refresh (el front recarga `/users/me`). Considerar incrementar `tokenVersion` o rotar el token.
- Protecciones contra bloqueo: nadie puede desactivarse a sí mismo ni quitarse `users`; no se puede quitar `users` al último usuario activo que lo tenga.

### Resumen
- `GET /dashboard/summary` → conteos por módulo, actividad semanal (8 semanas) y lista "Necesita tu atención". Solo agregaciones, sin tablas nuevas.

## 4. Para pasar un módulo de `mock` a `real`

1. `API_MODE_AUTH=real`, `NEXT_PUBLIC_AUTH_PROVIDER=firebase` y credenciales Firebase en `.env.local` (ver `firebase-identity-provider.ts`).
2. `PANEL_API_URL=http://localhost:4000` (panel-api local).
3. `API_MODE_PROJECTS=real` (ya existe todo lo necesario, con 2.1 como mejora).
4. `API_MODE_MEDIA`, `API_MODE_PORTFOLIO` y `API_MODE_PUBLICATION` cuando existan los endpoints de la sección 3.
5. Validar en Yaak y en el panel con los mismos casos que usa el mock.
